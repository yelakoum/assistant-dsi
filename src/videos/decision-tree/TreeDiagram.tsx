import React from "react";
import { COLORS, FONT_UI } from "../../theme";

export type TreeState = {
  root: number;
  leftLeaf: number;
  rightNode: number;
  rightLow: number;
  rightHigh: number;
  /** Highlights the path root → oui → oui → RÉUSSI. */
  path: number;
};

const FAIL = COLORS.red;
const PASS = COLORS.green;

/** "Révisé > 4 h ?" → non: RATÉ / oui: "Dormi > 5 h ?" → non: RATÉ / oui: RÉUSSI */
export const TreeDiagram: React.FC<{ s: TreeState; width: number; height: number }> = ({ s, width, height }) => {
  const root = { x: width / 2, y: 52 };
  const left = { x: width * 0.2, y: 190 };
  const right = { x: width * 0.68, y: 190 };
  const rLow = { x: width * 0.5, y: height - 52 };
  const rHigh = { x: width * 0.85, y: height - 52 };

  const edge = (a: { x: number; y: number }, b: { x: number; y: number }, amount: number, label: string, on: number) =>
    amount > 0 ? (
      <g opacity={Math.min(1, amount)}>
        <line
          x1={a.x}
          y1={a.y + 34}
          x2={a.x + (b.x - a.x) * Math.min(1, amount)}
          y2={a.y + 34 + (b.y - 34 - (a.y + 34)) * Math.min(1, amount)}
          stroke={on > 0 ? COLORS.yellow : "rgba(255,255,255,0.6)"}
          strokeWidth={on > 0 ? 7 : 4}
        />
        <text
          x={(a.x + b.x) / 2 + (b.x > a.x ? 22 : -22)}
          y={(a.y + b.y) / 2 + 8}
          textAnchor="middle"
          style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 28, fill: label === "oui" ? PASS : FAIL }}
        >
          {label}
        </text>
      </g>
    ) : null;

  const box = (c: { x: number; y: number }, text: string, color: string, amount: number, w: number, filled: boolean, on = 0) =>
    amount > 0 ? (
      <g transform={`translate(${c.x} ${c.y}) scale(${0.6 + 0.4 * Math.min(1, amount)})`} opacity={Math.min(1, amount * 1.4)}>
        <rect
          x={-w / 2}
          y={-34}
          width={w}
          height={68}
          rx={18}
          fill={filled ? color : "rgba(13,17,23,0.95)"}
          stroke={on > 0 ? COLORS.yellow : color}
          strokeWidth={on > 0 ? 6 : 4}
          style={{ filter: on > 0 ? `drop-shadow(0 0 14px ${COLORS.yellow})` : undefined }}
        />
        <text
          y={11}
          textAnchor="middle"
          style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 32, fill: filled ? "#0b0b0b" : "white" }}
        >
          {text}
        </text>
      </g>
    ) : null;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 26,
        backgroundColor: "rgba(13, 17, 23, 0.82)",
        border: "2px solid rgba(255,255,255,0.08)",
      }}
    >
      <svg width={width} height={height}>
        {edge(root, left, s.leftLeaf, "non", 0)}
        {edge(root, right, s.rightNode, "oui", s.path)}
        {edge(right, rLow, s.rightLow, "non", 0)}
        {edge(right, rHigh, s.rightHigh, "oui", s.path)}
        {box(root, "Révisé > 4 h ?", COLORS.blue, s.root, 330, false, s.path)}
        {box(left, "RATÉ", FAIL, s.leftLeaf, 170, true)}
        {box(right, "Dormi > 5 h ?", COLORS.blue, s.rightNode, 310, false, s.path)}
        {box(rLow, "RATÉ", FAIL, s.rightLow, 170, true)}
        {box(rHigh, "RÉUSSI", PASS, s.rightHigh, 200, true, s.path)}
      </svg>
    </div>
  );
};
