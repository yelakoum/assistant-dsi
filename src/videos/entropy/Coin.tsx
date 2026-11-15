import React from "react";
import { useCurrentFrame } from "remotion";
import { clampLerp } from "../../lib/anim";
import { COLORS, FONT_UI } from "../../theme";

export type Flip = { at: number; result: "P" | "F" };
const FLIP_FRAMES = 26;

/** A coin that flips (3D-ish via scaleX) and keeps a history of its results. */
export const Coin: React.FC<{
  flips: Flip[];
  label: string;
  sublabel: string;
  color: string;
  amount: number;
  size?: number;
}> = ({ flips, label, sublabel, color, amount, size = 230 }) => {
  const frame = useCurrentFrame();
  if (amount <= 0) return null;

  const done = flips.filter((f) => frame >= f.at + FLIP_FRAMES);
  const active = flips.find((f) => frame >= f.at && frame < f.at + FLIP_FRAMES);
  let face: "P" | "F" = done.length ? done[done.length - 1].result : "P";
  let scaleX = 1;
  let lift = 0;
  if (active) {
    const t = (frame - active.at) / FLIP_FRAMES;
    const turns = 3;
    const angle = t * Math.PI * 2 * turns;
    scaleX = Math.abs(Math.cos(angle));
    const showsStart = Math.cos(angle / 2) > 0;
    face = t > 0.85 ? active.result : showsStart ? face : face === "P" ? "F" : "P";
    lift = Math.sin(Math.PI * t) * 90;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.7 + 0.3 * Math.min(1, amount)})`,
      }}
    >
      <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 34, color }}>{label}</div>
      <div style={{ height: size + 90, display: "flex", alignItems: "flex-end" }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: `translateY(${-lift}px) scaleX(${Math.max(0.04, scaleX)})`,
            background:
              face === "P"
                ? "radial-gradient(circle at 35% 30%, #fff3b0 0%, #ffd34d 35%, #c99400 100%)"
                : "radial-gradient(circle at 35% 30%, #e8eef5 0%, #b8c4d2 40%, #6f7d8c 100%)",
            border: "8px solid rgba(0,0,0,0.25)",
            boxShadow: "0 24px 50px rgba(0,0,0,0.55), inset 0 0 0 10px rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_UI,
            fontWeight: 900,
            fontSize: size * 0.22,
            color: "rgba(0,0,0,0.6)",
          }}
        >
          {face === "P" ? "PILE" : "FACE"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, height: 44 }}>
        {done.slice(-5).map((f, i) => (
          <div
            key={`${f.at}-${i}`}
            style={{
              padding: "4px 12px",
              borderRadius: 10,
              backgroundColor: f.result === "P" ? "#ffd34d" : "#b8c4d2",
              color: "#111",
              fontFamily: FONT_UI,
              fontWeight: 900,
              fontSize: 24,
              opacity: clampLerp(frame, [f.at + FLIP_FRAMES, f.at + FLIP_FRAMES + 6], [0, 1]),
            }}
          >
            {f.result === "P" ? "PILE" : "FACE"}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 28, color: "#c9d1d9" }}>{sublabel}</div>
    </div>
  );
};

export const coinLandFrames = (flips: Flip[]) => flips.map((f) => f.at + FLIP_FRAMES);
export const COIN_COLORS = { rigged: COLORS.red, fair: COLORS.blue };
