import React from "react";
import { COLORS, FONT_UI } from "../../theme";
import { Line, PREDICT_X, PREDICT_Y, X, Y, fr } from "./data";

export const A_COLOR = "#ff9f43"; // slope
export const B_COLOR = COLORS.green; // intercept
const POINT_COLOR = COLORS.blue;
const RESIDUAL_COLOR = COLORS.red;

const X_DOMAIN: [number, number] = [0, 110];
const Y_DOMAIN: [number, number] = [0, 420];
const X_TICKS = [0, 20, 40, 60, 80, 100];
const Y_TICKS = [0, 100, 200, 300, 400];

export type ChartState = {
  axesIn: number;
  /** Highlight of the axis titles (0..1). */
  xLabelGlow: number;
  yLabelGlow: number;
  pointsIn: number[];
  line: (Line & { draw: number; opacity: number; color: string }) | null;
  residualsIn: number[];
  squaresIn: number[];
  /** Slope triangle ("a") and intercept marker ("b"). */
  slopeIn: number;
  interceptIn: number;
  chip: { text: string; amount: number } | null;
  predictionIn: number;
  /** Optional: spotlight one data point (ring) and its prediction on the line. */
  focus?: { index: number; ringIn: number; predictedIn: number };
};

export const RegressionChart: React.FC<{
  state: ChartState;
  width: number;
  height: number;
  style?: React.CSSProperties;
}> = ({ state, width, height, style }) => {
  const left = 118;
  const right = width - 24;
  const top = 24;
  const bottom = height - 86;
  const sx = (x: number) => left + ((x - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * (right - left);
  const sy = (y: number) => bottom - ((y - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * (bottom - top);
  const { line } = state;
  const lineY = (x: number) => (line ? line.a * x + line.b : 0);
  const axisLen = right - left + (bottom - top);

  const tickStyle: React.CSSProperties = { fontFamily: FONT_UI, fontWeight: 600, fontSize: 24, fill: "#8b949e" };
  const labelStyle = (glow: number): React.CSSProperties => ({
    fontFamily: FONT_UI,
    fontWeight: 800,
    fontSize: 30 + 6 * glow,
    fill: glow > 0.01 ? COLORS.yellow : "#c9d1d9",
    fillOpacity: 0.75 + 0.25 * glow,
  });

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 26,
        backgroundColor: "rgba(13, 17, 23, 0.82)",
        border: "2px solid rgba(255,255,255,0.08)",
        boxShadow: "0 40px 90px rgba(0,0,0,0.5)",
        ...style,
      }}
    >
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <defs>
          <clipPath id="plot-area">
            <rect x={left} y={top} width={right - left} height={bottom - top} />
          </clipPath>
        </defs>

        {/* Grid + ticks */}
        <g opacity={state.axesIn}>
          {Y_TICKS.map((t) => (
            <g key={`y${t}`}>
              <line x1={left} x2={right} y1={sy(t)} y2={sy(t)} stroke="rgba(255,255,255,0.07)" strokeWidth={2} />
              <text x={left - 14} y={sy(t) + 8} textAnchor="end" style={tickStyle}>
                {t}
              </text>
            </g>
          ))}
          {X_TICKS.map((t) => (
            <g key={`x${t}`}>
              <line x1={sx(t)} x2={sx(t)} y1={top} y2={bottom} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
              <text x={sx(t)} y={bottom + 36} textAnchor="middle" style={tickStyle}>
                {t}
              </text>
            </g>
          ))}
          <text x={(left + right) / 2} y={height - 14} textAnchor="middle" style={labelStyle(state.xLabelGlow)}>
            Surface (m²)  → X
          </text>
          <text
            x={28}
            y={(top + bottom) / 2}
            textAnchor="middle"
            transform={`rotate(-90 28 ${(top + bottom) / 2})`}
            style={labelStyle(state.yLabelGlow)}
          >
            Prix (k€)  → y
          </text>
        </g>
        {/* Axes, drawn in */}
        <path
          d={`M ${left} ${top} L ${left} ${bottom} L ${right} ${bottom}`}
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={axisLen}
          strokeDashoffset={axisLen * (1 - state.axesIn)}
        />

        <g clipPath="url(#plot-area)">
          {/* Squared errors */}
          {line
            ? X.map((x, i) => {
                const s = state.squaresIn[i] ?? 0;
                if (s <= 0) return null;
                const py = sy(Y[i]);
                const ly = sy(lineY(x));
                const side = Math.abs(py - ly) * s;
                return (
                  <rect
                    key={`sq${i}`}
                    x={sx(x)}
                    y={ly < py ? py - side : py}
                    width={side}
                    height={side}
                    fill={RESIDUAL_COLOR}
                    fillOpacity={0.2}
                    stroke={RESIDUAL_COLOR}
                    strokeWidth={2}
                    opacity={Math.min(1, s * 1.5)}
                  />
                );
              })
            : null}

          {/* Regression line */}
          {line && line.draw > 0 ? (
            <line
              x1={sx(X_DOMAIN[0])}
              y1={sy(lineY(X_DOMAIN[0]))}
              x2={sx(X_DOMAIN[0] + (X_DOMAIN[1] - X_DOMAIN[0]) * line.draw)}
              y2={sy(lineY(X_DOMAIN[0] + (X_DOMAIN[1] - X_DOMAIN[0]) * line.draw))}
              stroke={line.color}
              strokeWidth={8}
              strokeLinecap="round"
              opacity={line.opacity}
              style={{ filter: `drop-shadow(0 0 12px ${line.color})` }}
            />
          ) : null}

          {/* Residuals (errors) */}
          {line
            ? X.map((x, i) => {
                const r = state.residualsIn[i] ?? 0;
                if (r <= 0) return null;
                const py = sy(Y[i]);
                const ly = sy(lineY(x));
                return (
                  <line
                    key={`r${i}`}
                    x1={sx(x)}
                    x2={sx(x)}
                    y1={py}
                    y2={py + (ly - py) * r}
                    stroke={RESIDUAL_COLOR}
                    strokeWidth={5}
                    strokeDasharray="10 8"
                  />
                );
              })
            : null}
        </g>

        {/* Slope triangle: +20 m² along x, +20·a along y */}
        {line && state.slopeIn > 0 ? (
          <g opacity={state.slopeIn}>
            <path
              d={`M ${sx(40)} ${sy(lineY(40))} L ${sx(60)} ${sy(lineY(40))} L ${sx(60)} ${sy(lineY(60))}`}
              fill="none"
              stroke={A_COLOR}
              strokeWidth={5}
              strokeDasharray="12 8"
            />
            <text
              x={sx(60) + 18}
              y={(sy(lineY(40)) + sy(lineY(60))) / 2 + 14}
              style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 44, fill: A_COLOR }}
            >
              a = pente
            </text>
          </g>
        ) : null}

        {/* Intercept marker at x = 0 */}
        {line && state.interceptIn > 0 ? (
          <g opacity={state.interceptIn}>
            <circle cx={sx(0)} cy={sy(line.b)} r={14 * state.interceptIn} fill={B_COLOR} stroke="white" strokeWidth={3} />
            <text
              x={sx(0) + 26}
              y={sy(line.b) - 22}
              style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 40, fill: B_COLOR }}
            >
              b
            </text>
          </g>
        ) : null}

        {/* Data points */}
        {X.map((x, i) => {
          const p = state.pointsIn[i] ?? 0;
          if (p <= 0) return null;
          return (
            <circle
              key={`p${i}`}
              cx={sx(x)}
              cy={sy(Y[i])}
              r={16 * p}
              fill={POINT_COLOR}
              stroke="white"
              strokeWidth={4}
              style={{ filter: `drop-shadow(0 0 10px ${POINT_COLOR})` }}
            />
          );
        })}

        {/* Focused point: ring on the real value, dot on the line (prediction) */}
        {state.focus && line ? (
          <g>
            {state.focus.ringIn > 0 ? (
              <circle
                cx={sx(X[state.focus.index])}
                cy={sy(Y[state.focus.index])}
                r={30 + 8 * (1 - state.focus.ringIn)}
                fill="none"
                stroke={POINT_COLOR}
                strokeWidth={5}
                opacity={state.focus.ringIn}
              />
            ) : null}
            {state.focus.predictedIn > 0 ? (
              <circle
                cx={sx(X[state.focus.index])}
                cy={sy(lineY(X[state.focus.index]))}
                r={16 * state.focus.predictedIn}
                fill={COLORS.yellow}
                stroke="black"
                strokeWidth={4}
              />
            ) : null}
          </g>
        ) : null}

        {/* Prediction for 75 m² */}
        {state.predictionIn > 0 ? (
          <g opacity={Math.min(1, state.predictionIn)}>
            <path
              d={`M ${sx(PREDICT_X)} ${bottom} L ${sx(PREDICT_X)} ${sy(PREDICT_Y)} L ${left} ${sy(PREDICT_Y)}`}
              fill="none"
              stroke={COLORS.yellow}
              strokeWidth={4}
              strokeDasharray="10 8"
            />
            <circle
              cx={sx(PREDICT_X)}
              cy={sy(PREDICT_Y)}
              r={20 * state.predictionIn}
              fill={COLORS.yellow}
              stroke="black"
              strokeWidth={4}
            />
            <g transform={`translate(${sx(PREDICT_X) - 250}, ${sy(PREDICT_Y) - 120})`}>
              <rect width={290} height={70} rx={16} fill={COLORS.yellow} />
              <text
                x={145}
                y={47}
                textAnchor="middle"
                style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 32, fill: "#111" }}
              >
                75 m² → {fr(PREDICT_Y, 0)} k€
              </text>
            </g>
          </g>
        ) : null}
      </svg>

      {state.chip && state.chip.amount > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 36,
            right: 40,
            padding: "10px 22px",
            borderRadius: 14,
            backgroundColor: COLORS.green,
            color: "#0b0b0b",
            fontFamily: FONT_UI,
            fontWeight: 900,
            fontSize: 28,
            opacity: Math.min(1, state.chip.amount),
            transform: `scale(${0.6 + 0.4 * state.chip.amount})`,
            transformOrigin: "100% 0%",
          }}
        >
          {state.chip.text}
        </div>
      ) : null}
    </div>
  );
};
