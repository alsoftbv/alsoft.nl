import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import en from "@locales/en.json";
import nl from "@locales/nl.json";
import CrossSection, { type Geometry } from "./CrossSection";
import { Solver } from "./solver";
import {
  MIL,
  build,
  defaultTarget,
  fieldClass,
  geometryFields,
  initialState,
  isOuter,
  isPair,
  isStripline,
  parse,
  show,
  solvable,
  valuesFor,
  type FieldId,
  type Kind,
  type State,
  type Unit,
} from "./model";

type Props = { lang: "en" | "nl" };

type Answer = { key: string; out: Record<string, any>; ms: number };
type Loss = { key: string; ac: number; ad: number; f: number };

const DEBOUNCE_MS = 150;

export default function ImpedanceCalculator({ lang }: Props) {
  const t = (lang === "en" ? en : nl).impedance;
  const locale = lang === "en" ? "en-US" : "nl-NL";
  const [state, setState] = useState<State>(initialState);
  const [engine, setEngine] = useState<"loading" | "ready" | "failed">("loading");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loss, setLoss] = useState<Loss | null>(null);
  const solver = useRef<Solver | null>(null);
  const first = useRef(true);

  const startSolver = useCallback(() => {
    solver.current?.dispose();
    setEngine("loading");
    if (typeof WebAssembly === "undefined") {
      setEngine("failed");
      return;
    }
    const s = new Solver();
    solver.current = s;
    s.ready.then(
      () => solver.current === s && setEngine("ready"),
      () => solver.current === s && setEngine("failed")
    );
  }, []);

  useEffect(() => {
    startSolver();
    return () => solver.current?.dispose();
  }, [startSolver]);

  const { kind, unit, mode, values } = state;
  const built = useMemo(() => build(state), [state]);
  const key = built.ok ? built.key : "invalid";
  const bad = built.ok ? [] : built.bad;

  // the structure in mm, for the drawing: what is typed where it is a number, the solved value where it is being solved
  const geometry: Geometry = useMemo(() => {
    const n = (f: FieldId, d: number) => parse(values[f], fieldClass[f], unit) ?? d;
    const solved = mode === "find" && answer && answer.key === key ? (answer.out.value as number) : null;
    const pick = (f: FieldId, d: number) => (mode === "find" && state.solveFor === f ? solved ?? d : n(f, d));
    return {
      kind,
      w: pick("w", 0.2),
      s: pick("s", 0.15),
      gap: pick("gap", 0.15),
      h: n("h", 0.2),
      h1: n("h1", 0.2),
      h2: n("h2", 0.2),
      t: n("t", 0.035),
      mask: isOuter(kind) && state.mask ? n("mask_t", 0.01) : 0,
      ground: state.ground,
    };
  }, [state, answer, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // the main solve, shortly after the last keystroke
  useEffect(() => {
    if (engine !== "ready" || !solver.current || !built.ok) return;
    let alive = true;
    setBusy(true);
    const run = async () => {
      try {
        const r = await solver.current!.run(built.main, "main");
        if (!alive || !r) return;
        if (r.out.error) {
          setError(r.out.error);
          setAnswer(null);
        } else {
          setError(null);
          setAnswer({ key, out: r.out, ms: r.ms });
        }
        setBusy(false);
      } catch (e) {
        if (!alive) return;
        setError(String(e));
        setAnswer(null);
        setBusy(false);
      }
    };
    const h = setTimeout(run, first.current ? 0 : DEBOUNCE_MS);
    first.current = false;
    return () => {
      alive = false;
      clearTimeout(h);
    };
  }, [engine, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // loss follows the main answer (and the loss inputs) without holding it up
  const tanText = values.tan_d;
  const fText = values.f_ghz;
  useEffect(() => {
    if (engine !== "ready" || !solver.current || !built.ok || !built.loss || !answer || answer.key !== key) return;
    let alive = true;
    const req = { ...built.loss } as Record<string, unknown>;
    if (mode === "find") {
      req[state.solveFor] = answer.out.value;
      delete req.target;
      delete req.var;
    }
    const lossKey = `${key}|${tanText}|${fText}`;
    const h = setTimeout(async () => {
      try {
        const r = await solver.current!.run(req, "loss");
        if (!alive || !r || r.out.error) return;
        setLoss({ key: lossKey, ac: r.out.alpha_c_db_per_m, ad: r.out.alpha_d_db_per_m, f: r.out.f_ghz });
      } catch {
        /* the loss is optional */
      }
    }, DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(h);
    };
  }, [engine, answer, tanText, fText]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- changes
  const setValue = (f: FieldId, text: string) =>
    setState((s) => ({ ...s, values: { ...s.values, [f]: text } }));

  const setUnit = (u: Unit) =>
    setState((s) => {
      if (s.unit === u) return s;
      const values = { ...s.values };
      for (const f of Object.keys(values) as FieldId[]) {
        const cls = fieldClass[f];
        if (cls === "plain") continue;
        const mm = parse(values[f], cls, s.unit);
        if (mm !== null) values[f] = show(mm, cls, u);
      }
      return { ...s, unit: u, values };
    });

  const setKind = (k: Kind) =>
    setState((s) => {
      if (s.kind === k) return s;
      const keepTarget = s.values.target === String(defaultTarget(s.kind)) ? undefined : s.values.target;
      const v = valuesFor(k, s.unit, { ...s.values, target: keepTarget });
      return {
        ...s,
        kind: k,
        values: v,
        solveFor: solvable(k).includes(s.solveFor) ? s.solveFor : "w",
      };
    });

  const layer = isStripline(kind) ? "inner" : kind === "cpw" ? "cpw" : "outer";
  const pair = isPair(kind);
  const pickLayer = (l: "outer" | "inner" | "cpw") =>
    setKind(l === "cpw" ? "cpw" : l === "outer" ? (pair ? "microstrip_pair" : "microstrip") : pair ? "stripline_pair" : "stripline");
  const pickPair = (p: boolean) =>
    setKind(layer === "inner" ? (p ? "stripline_pair" : "stripline") : p ? "microstrip_pair" : "microstrip");

  const preset = (id: "jlc" | "thin") =>
    setState((s) => {
      const base = valuesFor("microstrip_pair", s.unit);
      if (id === "jlc") return { ...s, kind: "microstrip_pair", mode: "analyze", mask: true, values: base };
      const c = (f: FieldId, mm: number) => (base[f] = show(mm, fieldClass[f], s.unit));
      c("w", 0.127);
      c("s", 0.25);
      c("h", 0.09);
      base.er = "4.2";
      return { ...s, kind: "microstrip_pair", mode: "analyze", mask: false, values: base };
    });

  const useSolved = () => {
    if (!answer || mode !== "find") return;
    const f = state.solveFor;
    setState((s) => ({
      ...s,
      mode: "analyze",
      values: { ...s.values, [f]: show(answer.out.value, fieldClass[f], s.unit) },
    }));
  };

  // ---- formatting
  const num = (v: number, d: number) => v.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const len = (mm: number) => (unit === "mm" ? `${num(mm, 3)} mm` : `${num(mm / MIL, 2)} mil`);
  const lenOther = (mm: number) => (unit === "mm" ? `${num(mm / MIL, 2)} mil` : `${num(mm, 3)} mm`);
  const fmtLabelNum = (v: number) => {
    const s = v.toLocaleString(locale, { maximumFractionDigits: unit === "mm" ? 4 : 3 });
    return s;
  };

  const a = answer && answer.key === key ? (answer.out.analysis ?? answer.out) : null;
  const pending = !a;
  const dash = "–";
  const z = (v?: number) => (v === undefined || !Number.isFinite(v) ? dash : num(v, 1));
  const delay = (ps_mm?: number) =>
    ps_mm === undefined ? dash : unit === "mm" ? `${num(ps_mm, 2)} ps/mm` : `${num(ps_mm * 25.4, 1)} ps/in`;
  const lossText = (l: Loss | null) => {
    if (!l || l.key !== `${key}|${tanText}|${fText}`) return dash;
    const tot = l.ac + l.ad;
    return unit === "mm"
      ? `${num(tot, 1)} dB/m`
      : `${num(tot * 0.0254, 2)} dB/in`;
  };
  const lossParts = (l: Loss | null) => {
    if (!l || l.key !== `${key}|${tanText}|${fText}`) return "";
    const k = unit === "mm" ? 1 : 0.0254;
    return `${t.lossConductor} ${num(l.ac * k, unit === "mm" ? 1 : 2)} + ${t.lossDielectric} ${num(l.ad * k, unit === "mm" ? 1 : 2)}`;
  };

  // ---- the comparison with the closed-form formula
  let comparison: string | null = null;
  let comparisonNote: string | null = null;
  if (a && a.closed) {
    const primary = pair ? a.z_diff : a.z0;
    const cf = pair ? a.closed.z_diff : a.closed.z0;
    if (mode === "find" && answer?.out.closed_value) {
      const v = answer.out.value as number;
      const cv = answer.out.closed_value as number;
      const pct = ((cv - v) / v) * 100;
      comparison =
        Math.abs(pct) < 0.5
          ? t.compareWidthSame.replace("{cf}", len(cv))
          : (pct < 0 ? t.compareWidthNarrower : t.compareWidthWider)
              .replace("{cf}", len(cv))
              .replace("{pct}", num(Math.abs(pct), 1));
    } else if (mode === "analyze" && cf !== undefined) {
      const pct = ((cf - primary) / primary) * 100;
      comparison =
        Math.abs(pct) < 0.5
          ? t.compareSame.replace("{cf}", num(cf, 1)).replace("{pct}", num(Math.abs(pct), 1))
          : (pct < 0 ? t.compareLower : t.compareHigher)
              .replace("{cf}", num(cf, 1))
              .replace("{pct}", num(Math.abs(pct), 1));
    }
    if (isOuter(kind) && state.mask) comparisonNote = t.compareMask;
    else if (isStripline(kind)) comparisonNote = t.compareStripline;
  }

  const fieldLabel = (f: FieldId) => (t.fields as Record<string, string>)[f];
  const unitOf = (f: FieldId) => {
    const c = fieldClass[f];
    if (c === "len") return unit;
    if (c === "thin") return unit === "mm" ? "µm" : "mil";
    if (f === "f_ghz") return "GHz";
    if (f === "target") return "Ω";
    return "";
  };

  const renderField = (f: FieldId, solved = false) => {
    const invalid = bad.includes(f);
    const id = `imp-${f}`;
    return (
      <div className={`imp-field${solved ? " solved" : ""}`} key={f}>
        <label htmlFor={id}>
          {fieldLabel(f)}
          {(t.hints as Record<string, string>)[f] && <small>{(t.hints as Record<string, string>)[f]}</small>}
        </label>
        <span className="imp-input">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={solved ? (answer && answer.key === key ? show(answer.out.value, fieldClass[f], unit) : "") : values[f]}
            readOnly={solved}
            placeholder={solved ? dash : undefined}
            aria-invalid={invalid || undefined}
            onChange={(e) => setValue(f, e.target.value)}
          />
          <span className="imp-unit" aria-hidden="true">
            {unitOf(f)}
          </span>
        </span>
      </div>
    );
  };

  const geo = geometryFields(kind);
  const heroLabel = pair ? t.zdiff : t.z0;
  const hero = a ? z(pair ? a.z_diff : a.z0) : dash;
  const names = t.kinds as Record<string, string>;

  return (
    <div className="imp" data-engine={engine}>
      <style>{css}</style>

      <div className="imp-picker">
        <div className="imp-group" role="group" aria-label={t.layerLabel}>
          {(["outer", "inner", "cpw"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={layer === l} className="imp-chip" onClick={() => pickLayer(l)}>
              {t.layers[l]}
            </button>
          ))}
        </div>
        <div className="imp-group" role="group" aria-label={t.pairLabel} style={layer === "cpw" ? { visibility: "hidden" } : undefined}>
          <button type="button" className="imp-chip" aria-pressed={!pair} onClick={() => pickPair(false)} disabled={layer === "cpw"}>
            {t.single}
          </button>
          <button type="button" className="imp-chip" aria-pressed={pair} onClick={() => pickPair(true)} disabled={layer === "cpw"}>
            {t.differential}
          </button>
        </div>
        <div className="imp-group imp-units" role="group" aria-label={t.unitsLabel}>
          {(["mm", "mil"] as const).map((u) => (
            <button key={u} type="button" className="imp-chip" aria-pressed={unit === u} onClick={() => setUnit(u)}>
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="imp-grid">
        <div className="imp-left">
          <figure className="imp-figure">
            <figcaption>{names[kind]}</figcaption>
            <CrossSection
              g={geometry}
              unit={unit}
              decimals={fmtLabelNum}
              labels={{ plane: t.planeLabel, dielectric: `${t.dielectricLabel} εr ${values.er || "?"}`, air: t.airLabel, title: t.drawingLabel }}
            />
            <ul className="imp-legend" aria-hidden="true">
              <li><i style={{ background: "#ff9100" }} />{t.legendCopper}</li>
              <li><i style={{ background: "#b86a00" }} />{t.legendPlane}</li>
              {isOuter(kind) && state.mask && <li><i style={{ background: "#2e8b57" }} />{t.legendMask}</li>}
            </ul>
          </figure>

          <div className="imp-inputs">
            <div className="imp-modes" role="group" aria-label={t.modeLabel}>
              <button type="button" className="imp-chip" aria-pressed={mode === "analyze"} onClick={() => setState((s) => ({ ...s, mode: "analyze" }))}>
                {t.modeAnalyze}
              </button>
              <button type="button" className="imp-chip" aria-pressed={mode === "find"} onClick={() => setState((s) => ({ ...s, mode: "find" }))}>
                {t.modeFind}
              </button>
            </div>

            {mode === "find" && (
              <div className="imp-target">
                {renderField("target")}
                <div className="imp-field">
                  <label htmlFor="imp-solvefor">{t.solveFor}</label>
                  <span className="imp-input">
                    <select
                      id="imp-solvefor"
                      value={state.solveFor}
                      onChange={(e) => setState((s) => ({ ...s, solveFor: e.target.value as FieldId }))}
                    >
                      {solvable(kind).map((f) => (
                        <option key={f} value={f}>
                          {fieldLabel(f)}
                        </option>
                      ))}
                    </select>
                  </span>
                </div>
              </div>
            )}

            <div className="imp-fields">
              {geo.map((f) => renderField(f, mode === "find" && state.solveFor === f))}
              {renderField("er")}
              {renderField("t")}
            </div>

            {isOuter(kind) && (
              <div className="imp-opt">
                <label className="imp-check">
                  <input type="checkbox" checked={state.mask} onChange={(e) => setState((s) => ({ ...s, mask: e.target.checked }))} />
                  <span>{t.mask}</span>
                </label>
                {state.mask && (
                  <div className="imp-fields">
                    {renderField("mask_t")}
                    {renderField("mask_er")}
                  </div>
                )}
              </div>
            )}
            {kind === "cpw" && (
              <div className="imp-opt">
                <label className="imp-check">
                  <input type="checkbox" checked={state.ground} onChange={(e) => setState((s) => ({ ...s, ground: e.target.checked }))} />
                  <span>{t.ground}</span>
                </label>
              </div>
            )}

            <details className="imp-loss-inputs">
              <summary>{t.lossInputs}</summary>
              <div className="imp-fields">
                {renderField("tan_d")}
                {renderField("f_ghz")}
              </div>
            </details>

            <div className="imp-presets">
              <span>{t.examples}</span>
              <button type="button" className="imp-link" onClick={() => preset("jlc")}>{t.presetJlc}</button>
              <button type="button" className="imp-link" onClick={() => preset("thin")}>{t.presetThin}</button>
            </div>
          </div>
        </div>

        <aside className="imp-results" aria-live="polite" data-busy={busy || undefined}>
          <h2>{t.result}</h2>

          {engine === "failed" ? (
            <div className="imp-fail" role="alert">
              <p>{t.failed}</p>
              <button type="button" onClick={startSolver}>{t.retry}</button>
            </div>
          ) : error ? (
            <p className="imp-error" role="alert">
              {error.startsWith("target ") ? t.unreachable : t.solverError}
            </p>
          ) : bad.length > 0 ? (
            <p className="imp-error" role="alert">{t.badInput}</p>
          ) : null}

          {mode === "find" ? (
            <div className="imp-hero" data-testid="hero">
              <span className="imp-hero-label">{t.foundLabel.replace("{what}", fieldLabel(state.solveFor).toLowerCase()).replace("{z}", values.target || "?")}</span>
              <span className="imp-hero-value" data-testid="found">
                {answer && answer.key === key ? len(answer.out.value) : dash}
              </span>
              {answer && answer.key === key && <span className="imp-hero-sub">{lenOther(answer.out.value)} · {pair ? t.zdiff : t.z0} {z(answer.out.achieved)} Ω</span>}
            </div>
          ) : (
            <div className="imp-hero" data-testid="hero">
              <span className="imp-hero-label">{heroLabel}</span>
              <span className="imp-hero-value" data-testid={pair ? "zdiff" : "z0"}>
                {hero}
                {a && <small> Ω</small>}
              </span>
            </div>
          )}

          <dl className="imp-rows">
            {pair ? (
              <>
                {mode === "find" && (
                  <Row k={t.zdiff} v={a ? `${z(a.z_diff)} Ω` : dash} id="zdiff" />
                )}
                <Row k={t.zcommon} v={a ? `${z(a.z_common)} Ω` : dash} id="zcm" />
                <Row k={t.zodd} v={a ? `${z(a.z_odd)} Ω` : dash} id="zodd" />
                <Row k={t.zeven} v={a ? `${z(a.z_even)} Ω` : dash} id="zeven" />
                <Row k={t.erOdd} v={a ? num(a.er_odd, 3) : dash} id="er" />
                <Row k={t.delay} v={a ? delay(a.delay_odd_ps_per_mm) : dash} id="delay" />
              </>
            ) : (
              <>
                {mode === "find" && <Row k={t.z0} v={a ? `${z(a.z0)} Ω` : dash} id="z0" />}
                <Row k={t.erEff} v={a ? num(a.er_eff, 3) : dash} id="er" />
                <Row k={t.delay} v={a ? delay(a.delay_ps_per_mm) : dash} id="delay" />
              </>
            )}
            <Row k={t.lossAt.replace("{f}", values.f_ghz || "?")} v={lossText(loss)} id="loss" sub={lossParts(loss)} />
          </dl>

          <div className="imp-compare" data-testid="compare">
            <strong>{t.formulaTitle}</strong>
            {a && a.closed && mode === "analyze" && (
              <span className="imp-compare-value" data-testid="closed-value">
                {z(pair ? a.closed.z_diff : a.closed.z0)} Ω
              </span>
            )}
            {mode === "find" && answer?.out.closed_value && answer.key === key && (
              <span className="imp-compare-value" data-testid="closed-value">{len(answer.out.closed_value)}</span>
            )}
            <p>{comparison ?? (a ? t.formulaNone : t.formulaWaiting)}</p>
            {comparisonNote && <p className="imp-note">{comparisonNote}</p>}
          </div>

          {mode === "find" && answer && answer.key === key && (
            <button type="button" className="imp-use" onClick={useSolved}>
              {t.useSolved.replace("{what}", fieldLabel(state.solveFor).toLowerCase())}
            </button>
          )}

          <p className="imp-meta">
            {engine === "loading"
              ? t.loading
              : answer && answer.key === key
                ? t.solved.replace("{ms}", String(Math.max(1, Math.round(answer.ms)))).replace("{n}", String(a?.panels ?? ""))
                : busy
                  ? t.solving
                  : " "}
          </p>
        </aside>
      </div>

      <div className="imp-sticky" aria-hidden="true">
        <span>{mode === "find" ? t.foundShort : heroLabel}</span>
        <strong>{mode === "find" ? (answer && answer.key === key ? len(answer.out.value) : dash) : a ? `${hero} Ω` : dash}</strong>
      </div>
      <noscript>
        <p>{t.noscript}</p>
      </noscript>
    </div>
  );
}

function Row({ k, v, id, sub }: { k: string; v: string; id: string; sub?: string }) {
  return (
    <div className="imp-row">
      <dt>{k}</dt>
      <dd data-testid={id}>{v}</dd>
      {sub !== undefined && <small className="imp-row-sub">{sub || "\u00a0"}</small>}
    </div>
  );
}

const css = `
  .imp { display: flex; flex-direction: column; gap: 1.5rem; }
  .imp-picker { display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; align-items: center; }
  .imp-group { display: inline-flex; gap: 0.4rem; flex-wrap: wrap; }
  .imp-units { margin-left: auto; }
  .imp-chip {
    background: var(--surface-2); color: var(--text); border: 1px solid var(--border);
    padding: 0.55em 1em; border-radius: 999px; font-size: 0.92rem; font-weight: 500;
  }
  .imp-chip:hover { background: var(--surface-2); border-color: var(--accent); transform: none; }
  .imp-chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #000; font-weight: 600; }
  .imp-chip:disabled { opacity: 0.4; cursor: default; }

  .imp-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  .imp-left { display: flex; flex-direction: column; gap: 1.5rem; min-width: 0; }
  .imp-figure { margin: 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); }
  .imp-figure figcaption { font-weight: 600; margin-bottom: 0.25rem; }
  .imp-xs { width: 100%; height: auto; display: block; aspect-ratio: 480 / 270; }
  .imp-legend { display: flex; flex-wrap: wrap; gap: 0.4rem 1.25rem; list-style: none; margin: 0.25rem 0 0; padding: 0; color: var(--muted); font-size: 0.85rem; min-height: 1.3em; }
  .imp-legend li { display: inline-flex; align-items: center; gap: 0.4rem; }
  .imp-legend i { width: 0.8rem; height: 0.8rem; border-radius: 2px; display: inline-block; }

  .imp-inputs { display: flex; flex-direction: column; gap: 1.25rem; }
  .imp-modes { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .imp-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1rem; }
  .imp-field { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
  .imp-field label { font-size: 0.9rem; font-weight: 500; display: flex; flex-direction: column; justify-content: flex-end; gap: 0.1rem; min-height: 2.4em; }
  .imp-field label small { color: var(--muted); font-weight: 400; font-size: 0.78rem; line-height: 1.3; }
  .imp-input { position: relative; display: block; }
  .imp-input input, .imp-input select { width: 100%; box-sizing: border-box; padding-right: 3.2rem; font-size: 1rem; }
  .imp-input select { padding-right: 2rem; }
  .imp-unit { position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 0.85rem; pointer-events: none; }
  .imp-input input[aria-invalid="true"] { border-color: #ff6b5e; box-shadow: 0 0 0 2px rgba(255, 107, 94, 0.18); }
  .imp-field.solved input { border-style: dashed; border-color: var(--accent); background: var(--accent-soft); }
  .imp-target { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); }
  .imp-opt { display: flex; flex-direction: column; gap: 0.9rem; }
  .imp-check { display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer; font-weight: 500; }
  .imp-check input { width: 1.1rem; height: 1.1rem; padding: 0; accent-color: var(--accent); }
  .imp-loss-inputs summary { cursor: pointer; color: var(--muted); font-size: 0.9rem; margin-bottom: 0.75rem; }
  .imp-presets { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; align-items: baseline; color: var(--muted); font-size: 0.88rem; }
  .imp-link { background: none; color: var(--accent); padding: 0; border-radius: 0; font-size: 0.88rem; font-weight: 500; text-align: left; text-decoration: underline; text-underline-offset: 3px; }
  .imp-link:hover { background: none; transform: none; color: var(--accent-hover); }

  .imp-results { position: sticky; top: 1rem; display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); min-width: 0; }
  .imp-results h2 { margin: 0; font-size: 1.1rem; color: var(--muted); font-weight: 600; }
  .imp-results[data-busy] .imp-hero-value, .imp-results[data-busy] .imp-rows { opacity: 0.55; }
  .imp-hero { display: flex; flex-direction: column; gap: 0.15rem; min-height: 5.6rem; }
  .imp-hero-label { color: var(--muted); font-size: 0.9rem; }
  .imp-hero-value { font-size: 3rem; font-weight: 700; letter-spacing: -0.03em; color: var(--accent); line-height: 1.1; }
  .imp-hero-value small { font-size: 1.4rem; font-weight: 600; }
  .imp-hero-sub { color: var(--muted); font-size: 0.9rem; }
  .imp-rows { margin: 0; display: flex; flex-direction: column; }
  .imp-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 1rem; padding: 0.55rem 0; border-top: 1px solid var(--border); }
  .imp-row dt { color: var(--muted); }
  .imp-row dd { margin: 0; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
  .imp-row-sub { flex-basis: 100%; text-align: right; color: var(--muted); font-size: 0.78rem; min-height: 1.3em; }
  .imp-compare { padding: 1rem; border-radius: 8px; background: var(--accent-soft); display: flex; flex-direction: column; gap: 0.25rem; }
  .imp-compare p { margin: 0; font-size: 0.92rem; line-height: 1.5; }
  .imp-compare .imp-note { color: var(--muted); font-size: 0.82rem; }
  .imp-compare-value { font-size: 1.4rem; font-weight: 700; }
  .imp-use { align-self: flex-start; }
  .imp-meta { margin: 0; color: var(--muted); font-size: 0.82rem; min-height: 3.3em; }
  .imp-error { margin: 0; padding: 0.75rem 1rem; border: 1px solid #ff6b5e; border-radius: 8px; color: #ffb3ab; }
  .imp-fail { padding: 1rem; border: 1px solid #ff6b5e; border-radius: 8px; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; }
  .imp-fail p { margin: 0; }
  .imp-sticky { display: none; }

  @media (max-width: 900px) {
    .imp-grid { grid-template-columns: minmax(0, 1fr); }
    .imp-results { position: static; padding: 1rem; }
    .imp-hero-value { font-size: 2.4rem; }
    .imp-units { margin-left: 0; }
    .imp-figure { padding: 0.5rem; }
    .imp-sticky {
      display: flex; justify-content: space-between; align-items: baseline; position: sticky; bottom: 0.75rem; z-index: 5;
      padding: 0.6rem 1rem; border: 1px solid var(--accent); border-radius: 8px; background: var(--surface-2);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    }
    .imp-sticky strong { color: var(--accent); font-size: 1.25rem; }
  }
  @media (max-width: 340px) {
    .imp-fields, .imp-target { grid-template-columns: minmax(0, 1fr); }
  }
`;
