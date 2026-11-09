import React from "react";
import { COLORS, FONT_UI } from "../../theme";
import { fr } from "../linear-regression/data";
import { BEST_A, cost } from "./descent";
import { Hiker } from "./Hiker";

const A_DOMAIN: [number, number] = [-0.4, 7.2];
const COST_MAX = 62000;

export type ValleyState = {
  curveIn: number;
  bestIn: number;
  hiker: { a: number; lift: number; walk: number; facing: 1 | -1; opacity: number; tint?: string } | null;
  /** 0..1 — fog that hides everything but a small circle around the hiker. */
  fog: number;
  /** Tangent arrow under the hiker's feet. */
  slope: { amount: number; direction: "downhill" | "uphill"; label: string } | null;
  trail: { a: number; amount: number }[];
  score: { amount: number; color: string } | null;
  chip: { text: string; amount: number; color: string } | null;
  stamp: { text: string; amount: number; color: string } | null;
};

export const Valley: React.FC<{ state: ValleyState; width: number; height: number }> = ({ state, width, height }) => {
  const left = 80;
  const right = width - 30;
  const top = 30;
  const bottom = height - 64;
  const sa = (a: number) => left + ((a - A_DOMAIN[0]) / (A_DOMAIN[1] - A_DOMAIN[0])) * (right - left);
  const sc = (c: number) => bottom - (c / COST_MAX) * (bottom - top);

  const samples = Array.from({ length: 121 }, (_, i) => A_DOMAIN[0] + ((A_DOMAIN[1] - A_DOMAIN[0]) * i) / 120);
  const curve = samples.map((a, i) => `${i === 0 ? "M" : "L"} ${sa(a).toFixed(1)} ${sc(cost(a)).toFixed(1)}`).join(" ");
  const ground = `${curve} L ${right} ${height} L ${left} ${height} Z`;

  const { hiker } = state;
  const hx = hiker ? sa(hiker.a) : 0;
  const hy = hiker ? sc(cost(hiker.a)) - hiker.lift : 0;

  // Tangent direction (in pixels) under the hiker.
  let tangent: { dx: number; dy: number } | null = null;
  if (hiker && state.slope && state.slope.amount > 0) {
    const eps = 0.01;
    const dx = sa(hiker.a + eps) - sa(hiker.a);
    const dy = sc(cost(hiker.a + eps)) - sc(cost(hiker.a));
    const len = Math.hypot(dx, dy);
    tangent = { dx: dx / len, dy: dy / len };
    // Point the arrow downhill (dy > 0 in screen space) or uphill.
    const goesDown = tangent.dy > 0;
    if ((state.slope.direction === "downhill") !== goesDown) tangent = { dx: -tangent.dx, dy: -tangent.dy };
  }
  const arrowLen = 150 * (state.slope?.amount ?? 0);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 26,
        overflow: "hidden",
        background: "linear-gradient(180deg, #0f1b2e 0%, #0b1220 100%)",
        border: "2px solid rgba(255,255,255,0.08)",
        boxShadow: "0 40px 90px rgba(0,0,0,0.5)",
      }}
    >
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f6b4a" />
            <stop offset="100%" stopColor="#0d2418" />
          </linearGradient>
          <clipPath id="valley-reveal">
            <rect x={0} y={0} width={left + (right - left) * state.curveIn + 4} height={height} />
          </clipPath>
        </defs>

        <g clipPath="url(#valley-reveal)">
          <path d={ground} fill="url(#ground)" opacity={0.9} />
          <path d={curve} fill="none" stroke="#7ee2a8" strokeWidth={6} strokeLinejoin="round" />
        </g>

        {/* Axis labels */}
        <text
          x={(left + right) / 2}
          y={height - 18}
          textAnchor="middle"
          style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 28, fill: "#c9d1d9" }}
          opacity={state.curveIn}
        >
          prix au m² (a)  →
        </text>
        <text
          x={34}
          y={(top + bottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 34 ${(top + bottom) / 2})`}
          style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 28, fill: "#c9d1d9" }}
          opacity={state.curveIn}
        >
          score d'erreur  →
        </text>

        {/* Bottom of the valley */}
        {state.bestIn > 0 ? (
          <g opacity={state.bestIn} transform={`translate(${sa(BEST_A)} ${sc(cost(BEST_A))})`}>
            <path d="M 0 0 L 0 -70" stroke="white" strokeWidth={4} />
            <path d="M 0 -70 L 44 -58 L 0 -46 Z" fill={COLORS.green} />
            <circle r={9} fill={COLORS.green} />
          </g>
        ) : null}

        {/* Previous steps */}
        {state.trail.map((t, i) =>
          t.amount > 0 ? (
            <circle key={i} cx={sa(t.a)} cy={sc(cost(t.a))} r={9} fill={COLORS.yellow} opacity={0.85 * t.amount} />
          ) : null,
        )}

        {/* Slope under the feet */}
        {hiker && tangent && arrowLen > 0 ? (
          <g opacity={state.slope!.amount}>
            <line
              x1={hx - tangent.dx * 40}
              y1={hy + hiker.lift - tangent.dy * 40}
              x2={hx + tangent.dx * arrowLen}
              y2={hy + hiker.lift + tangent.dy * arrowLen}
              stroke={COLORS.yellow}
              strokeWidth={7}
              strokeLinecap="round"
            />
            <polygon
              points="0,-14 26,0 0,14"
              fill={COLORS.yellow}
              transform={`translate(${hx + tangent.dx * arrowLen} ${hy + hiker.lift + tangent.dy * arrowLen}) rotate(${(Math.atan2(tangent.dy, tangent.dx) * 180) / Math.PI})`}
            />
          </g>
        ) : null}

        {hiker ? (
          <Hiker x={hx} y={hy} walk={hiker.walk} facing={hiker.facing} opacity={hiker.opacity} tint={hiker.tint} scale={1.15} />
        ) : null}
      </svg>

      {/* Fog: everything disappears except a small circle around the hiker */}
      {state.fog > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: state.fog,
            background: hiker
              ? `radial-gradient(circle at ${hx}px ${hy - 50}px, rgba(160,174,195,0) 0px, rgba(160,174,195,0) 110px, rgba(160,174,195,0.96) 230px)`
              : "rgba(160,174,195,0.96)",
          }}
        />
      ) : null}

      {/* Slope label (above the fog): beside the middle of the arrow, kept inside the frame */}
      {hiker && tangent && state.slope && state.slope.amount > 0
        ? (() => {
            const midX = hx + tangent.dx * arrowLen * 0.6;
            const midY = hy + hiker.lift + tangent.dy * arrowLen * 0.6;
            // Normal pointing to the lower side of the arrow, away from the hiker's body.
            let nx = -tangent.dy;
            let ny = tangent.dx;
            if (ny < 0) {
              nx = -nx;
              ny = -ny;
            }
            const labelX = Math.min(width - 210, Math.max(10, midX + nx * 70 - 100));
            const labelY = Math.min(height - 112, Math.max(10, midY + ny * 70 - 20));
            return (
              <div
                style={{
                  position: "absolute",
                  left: labelX,
                  top: labelY,
                  width: 200,
                  textAlign: "center",
                  fontFamily: FONT_UI,
                  fontWeight: 900,
                  fontSize: 32,
                  color: COLORS.yellow,
                  textShadow: "0 0 8px black, 0 0 8px black, 0 0 4px black",
                  opacity: state.slope.amount,
                }}
              >
                {state.slope.label}
              </div>
            );
          })()
        : null}

      {/* a value tag following the hiker */}
      {hiker && hiker.opacity > 0 && hy > -60 ? (
        <div
          style={{
            position: "absolute",
            left: hx - 70,
            top: Math.max(8, hy - 168),
            width: 140,
            textAlign: "center",
            fontFamily: FONT_UI,
            fontWeight: 900,
            fontSize: 26,
            color: "white",
            textShadow: "0 0 8px black",
            opacity: hiker.opacity,
          }}
        >
          a = {fr(hiker.a, 2)}
        </div>
      ) : null}

      {state.score && state.score.amount > 0 && hiker ? (
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 26,
            padding: "10px 20px",
            borderRadius: 16,
            backgroundColor: "rgba(0,0,0,0.65)",
            border: `2px solid ${state.score.color}`,
            textAlign: "right",
            opacity: state.score.amount,
          }}
        >
          <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 18, letterSpacing: 2, color: "#c9d1d9" }}>
            SCORE D'ERREUR
          </div>
          <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 46, color: state.score.color }}>
            {fr(Math.min(cost(hiker.a), 999999), 0)}
          </div>
        </div>
      ) : null}

      {state.chip && state.chip.amount > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 26,
            padding: "10px 20px",
            borderRadius: 14,
            backgroundColor: state.chip.color,
            color: "#0b0b0b",
            fontFamily: FONT_UI,
            fontWeight: 900,
            fontSize: 28,
            opacity: Math.min(1, state.chip.amount),
            transform: `scale(${0.6 + 0.4 * state.chip.amount})`,
            transformOrigin: "0% 0%",
          }}
        >
          {state.chip.text}
        </div>
      ) : null}

      {state.stamp && state.stamp.amount > 0 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            padding: "14px 40px",
            border: `10px solid ${state.stamp.color}`,
            borderRadius: 22,
            color: state.stamp.color,
            backgroundColor: "rgba(0,0,0,0.55)",
            fontFamily: FONT_UI,
            fontWeight: 900,
            fontSize: 96,
            letterSpacing: 4,
            whiteSpace: "nowrap",
            opacity: Math.min(1, state.stamp.amount),
            transform: `translate(-50%, -50%) rotate(-8deg) scale(${2.2 - 1.2 * Math.min(1, state.stamp.amount)})`,
          }}
        >
          {state.stamp.text}
        </div>
      ) : null}
    </div>
  );
};
