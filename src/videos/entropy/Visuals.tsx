import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clampLerp, springIn } from "../../lib/anim";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { fr } from "../linear-regression/data";
import { PALETTE } from "./data";

export const CHAPTERS = ["SURPRISE", "INFORMATION", "ENTROPIE", "ARBRE"];

/** 4 chapter chips + a thin progress line for the whole video. */
export const ChapterBar: React.FC<{ active: number; done: number; progress: number; amount: number; chapters?: string[] }> = ({
  active,
  done,
  progress,
  amount,
  chapters = CHAPTERS,
}) =>
  amount > 0 ? (
    <div style={{ opacity: Math.min(1, amount * 1.4) }}>
      <div style={{ display: "flex", gap: 8 }}>
        {chapters.map((c, i) => {
          const isActive = i === active;
          const isDone = i < done;
          return (
            <div
              key={c}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 12,
                backgroundColor: isActive ? COLORS.yellow : isDone ? "rgba(61,220,132,0.18)" : "rgba(255,255,255,0.06)",
                border: `2px solid ${isActive ? COLORS.yellow : isDone ? COLORS.green : "rgba(255,255,255,0.12)"}`,
                fontFamily: FONT_UI,
                fontWeight: 900,
                fontSize: 17,
                letterSpacing: 0.5,
                color: isActive ? "#0b0b0b" : isDone ? COLORS.green : "#8b949e",
                transform: `scale(${isActive ? 1.04 : 1})`,
              }}
            >
              {isDone ? "✓" : `${i + 1}`} {c}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 3, backgroundColor: COLORS.yellow }} />
      </div>
    </div>
  ) : null;

/** Big title whose letters drop in one by one. */
export const KineticWord: React.FC<{ text: string; at: number; stagger: number; size: number; color: string }> = ({
  text,
  at,
  stagger,
  size,
  color,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      {text.split("").map((ch, i) => {
        const p = springIn(frame - (at + i * stagger), { damping: 9, stiffness: 180 });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: FONT_UI,
              fontWeight: 900,
              fontSize: size,
              color,
              letterSpacing: 2,
              opacity: Math.min(1, p * 2),
              transform: `translateY(${(1 - p) * -160}px) rotate(${(1 - Math.min(1, p)) * (i % 2 ? 18 : -18)}deg)`,
              textShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 ${30 * Math.min(1, p)}px rgba(255,230,0,0.35)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** A box of coloured balls bouncing around: disorder made visible. */
export const ChaosBox: React.FC<{ width: number; height: number; amount: number; calm: number }> = ({
  width,
  height,
  amount,
  calm,
}) => {
  const frame = useCurrentFrame();
  if (amount <= 0) return null;
  const n = 26;
  const r = 20;
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 26,
        border: "3px solid rgba(255,255,255,0.25)",
        backgroundColor: "rgba(13,17,23,0.6)",
        overflow: "hidden",
        opacity: Math.min(1, amount * 1.4),
      }}
    >
      {Array.from({ length: n }, (_, i) => {
        const sx = 0.6 + ((i * 37) % 17) / 17;
        const sy = 0.5 + ((i * 53) % 13) / 13;
        const ph = i * 1.7;
        const t = frame / 60;
        const wildX = 0.5 + 0.42 * Math.sin(t * sx * 2.2 + ph);
        const wildY = 0.5 + 0.38 * Math.cos(t * sy * 2.6 + ph * 1.3);
        // When calm, balls settle sorted by colour (left: blue, right: red).
        const sortedX = (i < n / 2 ? 0.08 + (i % 6) * 0.065 : 0.6 + (i % 6) * 0.065);
        const sortedY = 0.2 + Math.floor((i % 13) / 6) * 0.3;
        const x = (wildX * (1 - calm) + sortedX * calm) * (width - 2 * r) + r;
        const y = (wildY * (1 - calm) + sortedY * calm) * (height - 2 * r) + r;
        const color = i < n / 2 ? PALETTE[0] : PALETTE[1];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: r,
              backgroundColor: color,
              border: "3px solid white",
              boxShadow: `0 0 12px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};

/** The 4-step plan. */
export type ChapterItem = { title: string; detail: string; icon: string };
const ENTROPY_ITEMS: ChapterItem[] = [
  { title: "LA SURPRISE", detail: "Pile ou face ?", icon: "◐" },
  { title: "L'INFORMATION", detail: "Combien de questions oui / non ?", icon: "?" },
  { title: "L'ENTROPIE", detail: "La formule, pas à pas", icon: "Σ" },
  { title: "L'ARBRE DE DÉCISION", detail: "À quoi elle sert", icon: "⑂" },
];

export const ChapterList: React.FC<{ ins: number[]; items?: ChapterItem[] }> = ({ ins, items = ENTROPY_ITEMS }) => {
  const colors = [COLORS.blue, COLORS.yellow, COLORS.green, "#ff9f43"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {items.map((it, i) => {
        const p = ins[i] ?? 0;
        return (
          <div
            key={it.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "30px 30px",
              borderRadius: 28,
              backgroundColor: "rgba(13,17,23,0.85)",
              border: `3px solid ${colors[i]}`,
              opacity: Math.min(1, p * 1.4),
              transform: `translateX(${(1 - Math.min(1, p)) * 160}px)`,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: colors[i],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_CODE,
                fontWeight: 700,
                fontSize: 46,
                color: "#0b0b0b",
                flexShrink: 0,
              }}
            >
              {it.icon}
            </div>
            <div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 44, color: colors[i] }}>
                {i + 1}. {it.title}
              </div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 31, color: "#c9d1d9" }}>{it.detail}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Two probability bars (pile / face) with each outcome's information under it. */
export const ProbBars: React.FC<{ p: number; amount: number; infoIn: number }> = ({ p, amount, infoIn }) => {
  if (amount <= 0) return null;
  const bars = [
    { label: "PILE", value: p, color: "#ffd34d" },
    { label: "FACE", value: 1 - p, color: "#b8c4d2" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 60, height: 400, opacity: Math.min(1, amount * 1.4) }}>
      {bars.map((b) => (
        <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", width: 300 }}>
          <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 36, color: "white", marginBottom: 8 }}>p = {fr(b.value, b.value === 0.5 ? 1 : 1)}</div>
          <div
            style={{
              width: 150,
              height: 250 * b.value * Math.min(1, amount),
              borderRadius: "16px 16px 0 0",
              background: `linear-gradient(180deg, ${b.color}, ${b.color}88)`,
              boxShadow: `0 0 24px ${b.color}55`,
            }}
          />
          <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 34, color: b.color, marginTop: 10 }}>{b.label}</div>
          <div style={{ fontFamily: FONT_CODE, fontSize: 28, color: COLORS.yellow, opacity: infoIn, marginTop: 4, whiteSpace: "nowrap" }}>
            −log₂ p = {fr(-Math.log2(b.value), b.value === 0.5 ? 0 : 2)}
          </div>
        </div>
      ))}
    </div>
  );
};

/** A mixed group split by a question into two pure groups; balls fly to their new jar. */
export const SplitDemo: React.FC<{
  width: number;
  parentIn: number;
  childrenIn: number;
  questionIn: number;
  split: number;
  valuesIn: number;
}> = ({ width, parentIn, childrenIn, questionIn, split, valuesIn }) => {
  const H = 640;
  const parent = { x: width / 2, y: 120 };
  const kids = [
    { x: width * 0.24, y: 500 },
    { x: width * 0.76, y: 500 },
  ];
  const jarW = 230;
  const jarH = 130;
  const r = 24;
  const balls = [0, 1, 2, 3, 4, 5].map((i) => {
    const green = i % 2 === 0; // mixed in the parent
    const pIdx = i;
    const px = parent.x - jarW / 2 + 40 + (pIdx % 3) * 75;
    const py = parent.y + jarH / 2 - 30 - Math.floor(pIdx / 3) * 52;
    const kid = green ? kids[1] : kids[0];
    const kIdx = Math.floor(i / 2);
    const kx = kid.x - jarW / 2 + 40 + kIdx * 75;
    const ky = kid.y + jarH / 2 - 30;
    return { green, px, py, kx, ky };
  });
  const jar = (c: { x: number; y: number }, label: string, h: string, color: string, amount: number) =>
    amount > 0 ? (
      <g opacity={Math.min(1, amount * 1.4)} transform={`translate(${c.x} ${c.y}) scale(${0.7 + 0.3 * Math.min(1, amount)})`}>
        <path
          d={`M ${-jarW / 2} ${-jarH / 2} L ${-jarW / 2} ${jarH / 2 - 16} Q ${-jarW / 2} ${jarH / 2} ${-jarW / 2 + 16} ${jarH / 2} L ${jarW / 2 - 16} ${jarH / 2} Q ${jarW / 2} ${jarH / 2} ${jarW / 2} ${jarH / 2 - 16} L ${jarW / 2} ${-jarH / 2}`}
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={4}
        />
        <text y={jarH / 2 + 50} textAnchor="middle" style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 36, fill: color }} opacity={valuesIn}>
          {h}
        </text>
        <text y={-jarH / 2 - 16} textAnchor="middle" style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 26, fill: "white" }}>
          {label}
        </text>
      </g>
    ) : null;

  return (
    <svg width={width} height={H}>
      {questionIn > 0 ? (
        <g opacity={Math.min(1, questionIn)}>
          <line x1={parent.x} y1={parent.y + 150} x2={kids[0].x} y2={kids[0].y - 100} stroke="rgba(255,255,255,0.5)" strokeWidth={4} />
          <line x1={parent.x} y1={parent.y + 150} x2={kids[1].x} y2={kids[1].y - 100} stroke="rgba(255,255,255,0.5)" strokeWidth={4} />
          <g transform={`translate(${parent.x} ${(parent.y + kids[0].y) / 2 + 40}) scale(${0.6 + 0.4 * Math.min(1, questionIn)})`}>
            <rect x={-150} y={-36} width={300} height={72} rx={18} fill="rgba(13,17,23,0.95)" stroke={COLORS.blue} strokeWidth={4} />
            <text y={12} textAnchor="middle" style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 32, fill: "white" }}>
              QUESTION ?
            </text>
          </g>
        </g>
      ) : null}
      {jar(parent, "GROUPE MÉLANGÉ", "H = 1 bit", COLORS.red, parentIn)}
      {jar(kids[0], "GROUPE PUR", "H = 0", COLORS.green, childrenIn)}
      {jar(kids[1], "GROUPE PUR", "H = 0", COLORS.green, childrenIn)}
      {parentIn > 0
        ? balls.map((b, i) => {
            const t = Math.min(1, Math.max(0, split * 1.3 - i * 0.05));
            const x = b.px + (b.kx - b.px) * t;
            const y = b.py + (b.ky - b.py) * t - Math.sin(Math.PI * t) * 120;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={r}
                fill={b.green ? COLORS.green : COLORS.red}
                stroke="white"
                strokeWidth={3}
                opacity={Math.min(1, parentIn * 1.4)}
              />
            );
          })
        : null}
    </svg>
  );
};

/** "Watch episode 3" call-out with a mini tree. */
export const EpisodeTeaser: React.FC<{ amount: number; buttonIn: number; children: React.ReactNode }> = ({
  amount,
  buttonIn,
  children,
}) => {
  const frame = useCurrentFrame();
  if (amount <= 0) return null;
  const bounce = Math.sin(frame / 6) * 8 * Math.min(1, buttonIn);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        padding: "30px 24px",
        borderRadius: 32,
        background: "linear-gradient(180deg, rgba(31,111,235,0.25), rgba(13,17,23,0.9))",
        border: `3px solid ${COLORS.yellow}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.8 + 0.2 * Math.min(1, amount)})`,
      }}
    >
      {children}
      <div
        style={{
          padding: "16px 34px",
          borderRadius: 20,
          backgroundColor: COLORS.yellow,
          color: "#0b0b0b",
          fontFamily: FONT_UI,
          fontWeight: 900,
          fontSize: 38,
          opacity: Math.min(1, buttonIn * 1.4),
          transform: `translateY(${bounce}px) scale(${0.6 + 0.4 * Math.min(1, buttonIn)})`,
        }}
      >
        ▶ REGARDE L'ÉPISODE 3
      </div>
      <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 28, color: "#c9d1d9", opacity: clampLerp(buttonIn, [0.5, 1], [0, 1]) }}>
        sur mon profil · série « ML en 1 minute »
      </div>
    </div>
  );
};

export const heatColor = (v: number) => interpolateColors(Math.min(1, v), [0, 0.5, 1], [COLORS.green, COLORS.yellow, COLORS.red]);
