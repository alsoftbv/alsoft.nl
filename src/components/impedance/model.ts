// What the calculator knows about a structure: its inputs, defaults and the request the solver takes.
// Canonical lengths are mm; the inputs hold text in the unit the visitor chose (mm or mil).

export type Kind =
  | "microstrip"
  | "microstrip_pair"
  | "stripline"
  | "stripline_pair"
  | "cpw";
export type Unit = "mm" | "mil";
export type Mode = "analyze" | "find";
export type FieldId =
  | "w"
  | "s"
  | "gap"
  | "h"
  | "h1"
  | "h2"
  | "t"
  | "er"
  | "tan_d"
  | "mask_t"
  | "mask_er"
  | "f_ghz"
  | "target";

// "len": mm or mil, "thin": um or mil (copper, mask), "plain": a number as it is
export type FieldClass = "len" | "thin" | "plain";
export const fieldClass: Record<FieldId, FieldClass> = {
  w: "len",
  s: "len",
  gap: "len",
  h: "len",
  h1: "len",
  h2: "len",
  t: "thin",
  er: "plain",
  tan_d: "plain",
  mask_t: "thin",
  mask_er: "plain",
  f_ghz: "plain",
  target: "plain",
};

export const MIL = 0.0254;

export const isPair = (k: Kind) => k === "microstrip_pair" || k === "stripline_pair";
export const isOuter = (k: Kind) => k === "microstrip" || k === "microstrip_pair";
export const isStripline = (k: Kind) => k === "stripline" || k === "stripline_pair";

/** Geometry inputs of a structure, in the order they are shown. */
export function geometryFields(k: Kind): FieldId[] {
  switch (k) {
    case "microstrip":
      return ["w", "h"];
    case "microstrip_pair":
      return ["w", "s", "h"];
    case "stripline":
      return ["w", "h1", "h2"];
    case "stripline_pair":
      return ["w", "s", "h1", "h2"];
    case "cpw":
      return ["w", "gap", "h"];
  }
}

/** What can be solved for: the trace width, the gap of a pair, the slot of a coplanar line. */
export function solvable(k: Kind): FieldId[] {
  return k === "cpw" ? ["w", "gap"] : isPair(k) ? ["w", "s"] : ["w"];
}

export type Values = Record<FieldId, string>;

/** Defaults in mm (copper and mask in mm too; converted when shown). */
export const defaults: Record<Kind, Record<string, number>> = {
  microstrip: { w: 0.36, h: 0.2104, t: 0.035 },
  microstrip_pair: { w: 0.2, s: 0.15, h: 0.2104, t: 0.035 },
  stripline: { w: 0.16, h1: 0.2, h2: 0.2, t: 0.0175 },
  stripline_pair: { w: 0.1, s: 0.15, h1: 0.2, h2: 0.2, t: 0.0175 },
  cpw: { w: 0.3, gap: 0.15, h: 0.2104, t: 0.035 },
};

export const defaultTarget = (k: Kind) => (isPair(k) ? 100 : 50);

const trim = (v: number, digits: number) => String(parseFloat(v.toFixed(digits)));

/** mm -> the text shown in the inputs. */
export function show(mm: number, cls: FieldClass, unit: Unit): string {
  if (cls === "len") return unit === "mm" ? trim(mm, 4) : trim(mm / MIL, 3);
  if (cls === "thin") return unit === "mm" ? trim(mm * 1000, 2) : trim(mm / MIL, 3);
  return trim(mm, 4);
}

/** Input text -> mm, or null when it is not a positive number. */
export function parse(text: string, cls: FieldClass, unit: Unit): number | null {
  const v = Number(text.trim().replace(",", "."));
  if (!text.trim() || !Number.isFinite(v) || v <= 0) return null;
  if (cls === "len") return unit === "mm" ? v : v * MIL;
  if (cls === "thin") return unit === "mm" ? v / 1000 : v * MIL;
  return v;
}

export function valuesFor(kind: Kind, unit: Unit, keep?: Partial<Values>): Values {
  const d = defaults[kind];
  const v: Values = {
    w: "", s: "", gap: "", h: "", h1: "", h2: "", t: "",
    er: keep?.er ?? "4.4",
    tan_d: keep?.tan_d ?? "0.02",
    mask_t: "",
    mask_er: keep?.mask_er ?? "3.8",
    f_ghz: keep?.f_ghz ?? "1",
    target: keep?.target ?? String(defaultTarget(kind)),
  };
  for (const f of Object.keys(d) as FieldId[]) v[f] = show(d[f], fieldClass[f], unit);
  v.mask_t = keep?.mask_t ?? show(0.01, "thin", unit);
  return v;
}

export interface State {
  kind: Kind;
  unit: Unit;
  mode: Mode;
  solveFor: FieldId;
  mask: boolean;
  ground: boolean;
  values: Values;
}

export function initialState(): State {
  return {
    kind: "microstrip_pair",
    unit: "mm",
    mode: "analyze",
    solveFor: "w",
    mask: true,
    ground: true,
    values: valuesFor("microstrip_pair", "mm"),
  };
}

export type Built =
  | { ok: true; main: Record<string, unknown>; loss: Record<string, unknown> | null; key: string }
  | { ok: false; bad: FieldId[] };

/** The solver request for the inputs, or the inputs that are not numbers. */
export function build(s: State): Built {
  const geo = geometryFields(s.kind);
  const bad: FieldId[] = [];
  const num = (f: FieldId) => {
    const v = parse(s.values[f], fieldClass[f], s.unit);
    if (v === null) bad.push(f);
    return v ?? 0;
  };
  const solving = s.mode === "find";
  const req: Record<string, unknown> = { kind: s.kind };
  for (const f of geo) {
    if (solving && f === s.solveFor) continue;
    req[f] = num(f);
  }
  req.er = num("er");
  req.t = num("t");
  if (isOuter(s.kind) && s.mask) {
    req.mask = { thickness: num("mask_t"), er: num("mask_er") };
  }
  if (s.kind === "cpw") req.ground = s.ground;
  if (solving) {
    req.op = "synth";
    req.var = s.solveFor;
    req.target = num("target");
  } else {
    req.op = "analyze";
  }
  const tanText = s.values.tan_d.trim().replace(",", ".");
  const tan = tanText !== "" && Number(tanText) >= 0 ? Number(tanText) : null; // 0 is a lossless dielectric
  const f = parse(s.values.f_ghz, "plain", s.unit);
  if (tan === null) bad.push("tan_d");
  if (f === null) bad.push("f_ghz");
  if (bad.length) return { ok: false, bad };
  return {
    ok: true,
    main: req,
    loss: { ...req, op: "loss", tan_d: tan, f_ghz: f },
    key: JSON.stringify(req),
  };
}
