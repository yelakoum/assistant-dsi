import React from "react";
import { useCurrentFrame } from "remotion";
import { springIn } from "../lib/anim";
import { FONT_UI } from "../theme";

export const TakeawayCard: React.FC<{
  label: string;
  detail: string;
  color: string;
  /** Absolute frame at which the card enters. */
  at: number;
}> = ({ label, detail, color, at }) => {
  const frame = useCurrentFrame();
  const p = springIn(frame - at, { damping: 13, stiffness: 170 });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "16px 28px",
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderLeft: `10px solid ${color}`,
        boxShadow: `0 16px 40px rgba(0,0,0,0.35), 0 0 ${30 * p}px ${color}22`,
        opacity: Math.min(1, p * 1.4),
        transform: `translateX(${(1 - p) * 140}px) scale(${0.9 + 0.1 * p})`,
        fontFamily: FONT_UI,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 42, color, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: 31, color: "#d7dce2", lineHeight: 1.2 }}>{detail}</div>
    </div>
  );
};
