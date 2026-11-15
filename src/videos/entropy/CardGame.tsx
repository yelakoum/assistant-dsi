import React from "react";
import { useCurrentFrame } from "remotion";
import { springIn } from "../../lib/anim";
import { COLORS, FONT_UI } from "../../theme";

/** 8 face-down cards; the star hides under card `target` (0-based). */
export const CardGame: React.FC<{
  width: number;
  dealAt: number;
  starAt: number;
  target: number;
  /** Bracket over the asked range [from, to] (inclusive), with its frame. */
  asks: { from: number; to: number; at: number; answerAt: number; answer: boolean }[];
  revealAt: number;
}> = ({ width, dealAt, starAt, target, asks, revealAt }) => {
  const frame = useCurrentFrame();
  const n = 8;
  const gap = 10;
  const cardW = (width - gap * (n - 1)) / n;
  const cardH = cardW * 1.45;

  // Which cards are still possible after the answers so far.
  const possible = Array.from({ length: n }, () => true);
  asks.forEach((a) => {
    if (frame < a.answerAt) return;
    for (let i = 0; i < n; i++) {
      const inRange = i >= a.from && i <= a.to;
      if (inRange !== a.answer) possible[i] = false;
    }
  });
  const current = [...asks].reverse().find((a) => frame >= a.at && frame < (asks[asks.indexOf(a) + 1]?.at ?? revealAt + 40));

  return (
    <div style={{ position: "relative", width, height: cardH + 70 }}>
      {current ? (
        <div
          style={{
            position: "absolute",
            left: current.from * (cardW + gap) - 4,
            width: (current.to - current.from + 1) * (cardW + gap) - gap + 8,
            top: 0,
            height: 26,
            borderTop: `6px solid ${COLORS.yellow}`,
            borderLeft: `6px solid ${COLORS.yellow}`,
            borderRight: `6px solid ${COLORS.yellow}`,
            borderRadius: "12px 12px 0 0",
            opacity: Math.min(1, springIn(frame - current.at, { damping: 200 }, 10)),
          }}
        />
      ) : null}
      {Array.from({ length: n }, (_, i) => {
        const deal = springIn(frame - (dealAt + i * 5), { damping: 13, stiffness: 180 });
        if (deal <= 0) return null;
        const isTarget = i === target;
        const flip = isTarget ? springIn(frame - revealAt, { damping: 200 }, 18) : 0;
        const showFront = isTarget && (frame < starAt + 30 || flip > 0.5);
        const starIn = isTarget ? springIn(frame - starAt, { damping: 12, stiffness: 200 }) : 0;
        const hiding = isTarget && frame >= starAt + 30 && flip < 0.5;
        const scaleX = isTarget && frame >= starAt + 20 && frame < starAt + 40 ? Math.abs(Math.cos(((frame - starAt - 20) / 20) * Math.PI)) : isTarget && flip > 0 && flip < 1 ? Math.abs(Math.cos(flip * Math.PI)) : 1;
        const dim = !possible[i] ? 0.18 : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * (cardW + gap),
              top: 40 + (1 - Math.min(1, deal)) * -120,
              width: cardW,
              height: cardH,
              borderRadius: 14,
              transform: `scaleX(${Math.max(0.05, scaleX)}) scale(${isTarget && flip >= 1 ? 1.08 : 1})`,
              opacity: Math.min(1, deal * 1.4) * dim,
              background: showFront && !hiding ? "linear-gradient(160deg, #fffbe6, #ffe28a)" : "linear-gradient(160deg, #1f6feb, #0b3d91)",
              border: `4px solid ${isTarget && flip >= 1 ? COLORS.yellow : "rgba(255,255,255,0.85)"}`,
              boxShadow: isTarget && flip >= 1 ? `0 0 34px ${COLORS.yellow}` : "0 10px 22px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_UI,
              fontWeight: 900,
              color: showFront && !hiding ? "#b8860b" : "rgba(255,255,255,0.85)",
              fontSize: showFront && !hiding ? 54 * Math.max(starIn, flip) : 30,
            }}
          >
            {showFront && !hiding ? "★" : i + 1}
          </div>
        );
      })}
    </div>
  );
};
