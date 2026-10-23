import { MIL, isPair, isStripline, type Kind, type Unit } from "./model";

// A to-scale cross-section of the structure (mm in), with the dimensions labelled in the visitor's unit.
// Very thin or very wide parts are given a minimum size on screen so they stay visible.

export interface Geometry {
  kind: Kind;
  w: number;
  s: number;
  gap: number;
  h: number;
  h1: number;
  h2: number;
  t: number;
  mask: number; // mm, 0 = none
  ground: boolean;
}

const W = 480;
const H = 270;
const X0 = 80; // drawing area, left
const X1 = 440; // right
const BASE = 214; // top of the lower plane
const TOP = 62; // highest point of the stack
const PLANE = 7;

const COPPER = "#ff9100";
const PLANE_FILL = "#b86a00";
const DIELECTRIC = "#262b31";
const MASK = "#2e8b57";
const LINE = "#a4a9b0";

export default function CrossSection({
  g,
  unit,
  decimals,
  labels,
}: {
  g: Geometry;
  unit: Unit;
  decimals: (v: number) => string;
  labels: { plane: string; dielectric: string; air: string; title: string };
}) {
  const pair = isPair(g.kind);
  const strip = isStripline(g.kind);
  const cpw = g.kind === "cpw";

  // millimetres across, and up, of what is drawn
  const trace = pair ? 2 * g.w + g.s : g.w;
  const stackH = strip ? g.h1 + g.t + g.h2 : g.h + g.t + 0.35 * g.h;
  const xExtent = trace + (cpw ? 2 * g.gap + 2 * Math.max(g.w, g.gap) : 2 * Math.max(0.5 * (strip ? stackH / 2 : g.h), 0.6 * g.w));
  const k = Math.min((X1 - X0) / xExtent, (BASE - TOP) / stackH);

  const px = (mm: number, min = 0) => Math.max(mm * k, min);
  const cx = (X0 + X1) / 2;
  const tPx = px(g.t, 3);
  const sPx = px(g.s, 8);
  const wPx = px(g.w, 6);
  const gapPx = px(g.gap, 8);
  const dielTop = BASE - px(g.h, 16); // outer layers and coplanar: the laminate's top face
  const traceBottom = strip ? BASE - px(g.h1, 10) : dielTop; // the y of a trace's bottom face
  const traceTop = traceBottom - tPx;
  const topY = strip ? traceTop - px(g.h2, 10) : dielTop; // top of the dielectric
  const m = g.mask > 0 && !strip && !cpw ? px(g.mask, 2.5) : 0;

  // the traces' x ranges
  const rects: [number, number][] = pair
    ? [
        [cx - sPx / 2 - wPx, cx - sPx / 2],
        [cx + sPx / 2, cx + sPx / 2 + wPx],
      ]
    : [[cx - wPx / 2, cx + wPx / 2]];
  const grounds: [number, number][] = cpw
    ? [
        [X0 - 10, rects[0][0] - gapPx],
        [rects[0][1] + gapPx, X1 + 10],
      ]
    : [];

  const fmt = (mm: number) => decimals(unit === "mm" ? mm : mm / MIL);
  const um = (mm: number) => (unit === "mm" ? decimals(mm * 1000) : decimals(mm / MIL));

  const arrowH = (x1: number, x2: number, y: number) => (
    <g stroke={LINE} strokeWidth={1}>
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} />
      <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} />
    </g>
  );
  const arrowV = (y1: number, y2: number, x: number) => (
    <g stroke={LINE} strokeWidth={1}>
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} />
      <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} />
    </g>
  );
  const text = (x: number, y: number, s: string, anchor: "start" | "middle" | "end" = "middle", fill = "#f2f3f5") => (
    <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={14} fontFamily="Inter, sans-serif">
      {s}
    </text>
  );

  // dimension line above the traces; above the upper plane for a stripline, with extension lines down to the traces
  const rowY = (strip ? topY - PLANE : traceTop) - 14;
  const label = (name: string, v: string) => `${name} ${v}`;

  return (
    <svg
      className="imp-xs"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={labels.title}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* dielectric */}
      <rect x={X0 - 10} y={topY} width={X1 - X0 + 20} height={BASE - topY} fill={DIELECTRIC} stroke="#3a4048" strokeWidth={1} />
      {/* lower plane (a ground plane: not drawn for a coplanar line without one) */}
      {(!cpw || g.ground) && <rect x={X0 - 10} y={BASE} width={X1 - X0 + 20} height={PLANE} fill={PLANE_FILL} />}
      {/* upper plane of a stripline */}
      {strip && <rect x={X0 - 10} y={topY - PLANE} width={X1 - X0 + 20} height={PLANE} fill={PLANE_FILL} />}
      {/* solder mask: over the laminate and around the copper */}
      {m > 0 && (
        <g fill={MASK} fillOpacity={0.55} stroke={MASK} strokeWidth={0.5}>
          <rect x={X0 - 10} y={dielTop - m} width={X1 - X0 + 20} height={m} />
          {rects.map(([a, b], i) => (
            <rect key={i} x={a - m} y={traceTop - m} width={b - a + 2 * m} height={tPx + m} />
          ))}
        </g>
      )}
      {/* coplanar grounds */}
      {grounds.map(([a, b], i) => (
        <rect key={i} x={a} y={traceTop} width={Math.max(b - a, 2)} height={tPx} fill={COPPER} fillOpacity={0.75} />
      ))}
      {/* signal traces */}
      {rects.map(([a, b], i) => (
        <rect key={i} x={a} y={traceTop} width={b - a} height={tPx} fill={COPPER} />
      ))}

      {/* labels inside and around */}
      {text(X0 - 4, BASE - 8, labels.dielectric, "start", LINE)}
      {(!cpw || g.ground) && text(X1 + 10, BASE + PLANE + 17, labels.plane, "end", LINE)}
      {strip && text(X1 + 10, topY - PLANE - 6, labels.plane, "end", LINE)}

      {/* width, gap */}
      {strip &&
        rects.flatMap(([a, b], i) =>
          [a, b].map((x, j) => (
            <line key={`${i}-${j}`} x1={x} y1={traceTop} x2={x} y2={rowY + 3} stroke={LINE} strokeWidth={0.5} strokeDasharray="2 2" />
          ))
        )}
      {arrowH(rects[0][0], rects[0][1], rowY)}
      {text((rects[0][0] + rects[0][1]) / 2, rowY - 7, label("w", fmt(g.w)))}
      {pair && (
        <>
          {arrowH(rects[0][1], rects[1][0], rowY)}
          {text((rects[0][1] + rects[1][0]) / 2, rowY - 7 - 17, label("s", fmt(g.s)))}
          <line x1={(rects[0][1] + rects[1][0]) / 2} y1={rowY - 20} x2={(rects[0][1] + rects[1][0]) / 2} y2={rowY} stroke={LINE} strokeWidth={0.5} strokeDasharray="2 2" />
        </>
      )}
      {cpw && (
        <>
          {arrowH(rects[0][0] - gapPx, rects[0][0], rowY)}
          {text(rects[0][0] - gapPx / 2, rowY - 7 - 17, label("gap", fmt(g.gap)))}
          <line x1={rects[0][0] - gapPx / 2} y1={rowY - 20} x2={rects[0][0] - gapPx / 2} y2={rowY} stroke={LINE} strokeWidth={0.5} strokeDasharray="2 2" />
        </>
      )}

      {/* heights, on the left */}
      {!strip && (
        <>
          {arrowV(dielTop, BASE, X0 - 28)}
          {text(X0 - 33, (dielTop + BASE) / 2 + 4, label("h", fmt(g.h)), "end")}
        </>
      )}
      {strip && (
        <>
          {arrowV(traceBottom, BASE, X0 - 28)}
          {text(X0 - 33, (traceBottom + BASE) / 2 + 4, label("h1", fmt(g.h1)), "end")}
          {arrowV(topY, traceTop, X0 - 28)}
          {text(X0 - 33, (topY + traceTop) / 2 + 4, label("h2", fmt(g.h2)), "end")}
        </>
      )}

      {/* copper thickness: beside the last trace, above the right-hand ground of a coplanar line */}
      {cpw ? (
        text(grounds[1][0] + 6, traceTop - 7, label("t", um(g.t)), "start", LINE)
      ) : (
        <>
          <line x1={rects[rects.length - 1][1] + m + 2} y1={traceTop + tPx / 2} x2={rects[rects.length - 1][1] + m + 14} y2={traceTop + tPx / 2} stroke={LINE} strokeWidth={0.75} />
          {text(rects[rects.length - 1][1] + m + 18, traceTop + tPx / 2 + 4, label("t", um(g.t)), "start", LINE)}
        </>
      )}

      {/* air above an outer layer */}
      {!strip && !cpw && text(X1 + 10, TOP - 14, labels.air, "end", LINE)}
    </svg>
  );
}
