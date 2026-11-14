import React from "react";
import { interpolateColors } from "remotion";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { fr } from "../linear-regression/data";

const PASS = COLORS.green;
const FAIL = COLORS.red;

/** Glass jar filled with passed (green) / failed (red) balls, with its entropy below. */
export const EntropyJar: React.FC<{
  passed: number;
  failed: number;
  label: string;
  h: number | null;
  amount: number;
  /** 0..1 — fraction of balls that have dropped in. */
  balls: number;
  /** 0..1 — reveal of the "H = …" value. */
  valueIn: number;
  width: number;
  height?: number;
}> = ({ passed, failed, label, h, amount, balls, valueIn, width, height = 300 }) => {
  if (amount <= 0) return null;
  const total = passed + failed;
  const perRow = total > 6 ? 5 : 3;
  const r = total > 6 ? 22 : 44;
  const gap = total > 6 ? 8 : 14;
  const jarW = perRow * (2 * r + gap) + 30;
  const jarH = total > 6 ? 170 : 300;
  const colors = [...Array(passed).fill(PASS), ...Array(failed).fill(FAIL)];
  const accent = h === null ? COLORS.blue : interpolateColors(h, [0, 0.5, 1], [PASS, COLORS.yellow, FAIL]);

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.7 + 0.3 * Math.min(1, amount)})`,
      }}
    >
      <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 30, color: "white", letterSpacing: 1 }}>{label}</div>
      <svg width={jarW + 8} height={jarH + 8}>
        <path
          d={`M 4 4 L 4 ${jarH - 16} Q 4 ${jarH + 4} 24 ${jarH + 4} L ${jarW - 16} ${jarH + 4} Q ${jarW + 4} ${jarH + 4} ${jarW + 4} ${jarH - 16} L ${jarW + 4} 4`}
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {colors.map((c, i) => {
          const visible = Math.min(1, Math.max(0, balls * total - i));
          if (visible <= 0) return null;
          const row = Math.floor(i / perRow);
          const col = i % perRow;
          const cx = 4 + 15 + r + col * (2 * r + gap);
          const cyFinal = jarH - 4 - r - row * (2 * r + gap);
          const cy = cyFinal - (1 - visible) * 140;
          return <circle key={i} cx={cx} cy={cy} r={r} fill={c} stroke="white" strokeWidth={3} opacity={visible} />;
        })}
      </svg>
      {h !== null ? (
        <div
          style={{
            fontFamily: FONT_CODE,
            fontWeight: 700,
            fontSize: 40,
            color: accent,
            opacity: Math.min(1, valueIn * 1.4),
            transform: `scale(${0.6 + 0.4 * Math.min(1, valueIn)})`,
          }}
        >
          H = {fr(h, h === 0 || h === 1 ? 0 : 2)}
        </div>
      ) : null}
    </div>
  );
};

/** Horizontal 0 → 1 gauge from "pur" (green) to "chaos" (red) with a needle. */
export const EntropyGauge: React.FC<{ value: number; amount: number; width: number; caption?: string }> = ({
  value,
  amount,
  width,
  caption,
}) => {
  if (amount <= 0) return null;
  const barW = width - 80;
  const x = 40 + barW * Math.max(0, Math.min(1, value));
  const color = interpolateColors(value, [0, 0.5, 1], [PASS, COLORS.yellow, FAIL]);
  return (
    <div
      style={{
        position: "relative",
        width,
        height: 170,
        borderRadius: 24,
        backgroundColor: "rgba(13,17,23,0.85)",
        border: "1px solid rgba(255,255,255,0.1)",
        opacity: Math.min(1, amount * 1.4),
        transform: `translateY(${(1 - Math.min(1, amount)) * 40}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 40, top: 18, fontFamily: FONT_UI, fontWeight: 900, fontSize: 24, letterSpacing: 2, color: "#c9d1d9" }}>
        ENTROPIE {caption ? <span style={{ color }}>· {caption}</span> : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 66,
          width: barW,
          height: 26,
          borderRadius: 13,
          background: `linear-gradient(90deg, ${PASS}, ${COLORS.yellow}, ${FAIL})`,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 4,
          top: 52,
          width: 8,
          height: 54,
          borderRadius: 4,
          backgroundColor: "white",
          boxShadow: `0 0 16px ${color}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 8,
          fontFamily: FONT_CODE,
          fontWeight: 700,
          fontSize: 40,
          color,
        }}
      >
        {fr(value, 2)}
      </div>
      <div style={{ position: "absolute", left: 40, top: 118, fontFamily: FONT_UI, fontWeight: 800, fontSize: 22, color: PASS }}>0 · PUR</div>
      <div style={{ position: "absolute", right: 40, top: 118, fontFamily: FONT_UI, fontWeight: 800, fontSize: 22, color: FAIL }}>1 · CHAOS</div>
    </div>
  );
};
