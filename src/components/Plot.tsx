import React from "react";
import { FONT_UI } from "../theme";

export type Scales = {
  sx: (x: number) => number;
  sy: (y: number) => number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Dark chart panel with axes, ticks and labels; draw your marks via `children(scales)`. */
export const Plot: React.FC<{
  width: number;
  height: number;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: number[];
  yTicks: number[];
  xLabel: string;
  yLabel: string;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  axesIn?: number;
  children?: (scales: Scales) => React.ReactNode;
  /** HTML drawn above the SVG (badges, chips…). */
  overlay?: (scales: Scales) => React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  width,
  height,
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  xLabel,
  yLabel,
  formatX = String,
  formatY = String,
  axesIn = 1,
  children,
  overlay,
  style,
}) => {
  const left = 112;
  const right = width - 28;
  const top = 28;
  const bottom = height - 86;
  const sx = (x: number) => left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * (right - left);
  const sy = (y: number) => bottom - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * (bottom - top);
  const scales: Scales = { sx, sy, left, right, top, bottom };
  const axisLen = right - left + (bottom - top);
  const tick: React.CSSProperties = { fontFamily: FONT_UI, fontWeight: 600, fontSize: 24, fill: "#8b949e" };
  const label: React.CSSProperties = { fontFamily: FONT_UI, fontWeight: 800, fontSize: 30, fill: "#c9d1d9" };

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
          <clipPath id={`plot-${width}-${height}`}>
            <rect x={left} y={top} width={right - left} height={bottom - top} />
          </clipPath>
        </defs>
        <g opacity={axesIn}>
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={left} x2={right} y1={sy(t)} y2={sy(t)} stroke="rgba(255,255,255,0.07)" strokeWidth={2} />
              <text x={left - 14} y={sy(t) + 8} textAnchor="end" style={tick}>
                {formatY(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={`x${t}`} x={sx(t)} y={bottom + 36} textAnchor="middle" style={tick}>
              {formatX(t)}
            </text>
          ))}
          <text x={(left + right) / 2} y={height - 14} textAnchor="middle" style={label}>
            {xLabel}
          </text>
          <text
            x={28}
            y={(top + bottom) / 2}
            textAnchor="middle"
            transform={`rotate(-90 28 ${(top + bottom) / 2})`}
            style={label}
          >
            {yLabel}
          </text>
        </g>
        <path
          d={`M ${left} ${top} L ${left} ${bottom} L ${right} ${bottom}`}
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={axisLen}
          strokeDashoffset={axisLen * (1 - axesIn)}
        />
        <g clipPath={`url(#plot-${width}-${height})`}>{children?.(scales)}</g>
      </svg>
      {overlay?.(scales)}
    </div>
  );
};

/** A data point that pops in. */
export const Dot: React.FC<{ x: number; y: number; r?: number; color: string; amount: number; stroke?: string }> = ({
  x,
  y,
  r = 17,
  color,
  amount,
  stroke = "white",
}) =>
  amount > 0 ? (
    <circle
      cx={x}
      cy={y}
      r={r * amount}
      fill={color}
      stroke={stroke}
      strokeWidth={4}
      style={{ filter: `drop-shadow(0 0 10px ${color})` }}
    />
  ) : null;
