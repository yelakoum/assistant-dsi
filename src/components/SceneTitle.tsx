import React from "react";
import { useCurrentFrame } from "remotion";
import { clampLerp, springIn } from "../lib/anim";
import { FONT_UI } from "../theme";

export type TitlePart = { text: string; color?: string };

/** Big punchy headline that springs in at `start` and fades out before `end`. */
export const SceneTitle: React.FC<{
  parts: TitlePart[];
  start: number;
  end: number;
  isLast?: boolean;
}> = ({ parts, start, end, isLast }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end + (isLast ? 1e9 : 0)) return null;

  const enter = springIn(frame - start, { damping: 14, stiffness: 160 });
  const exit = isLast ? 0 : clampLerp(frame, [end - 10, end], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: FONT_UI,
        fontWeight: 900,
        fontSize: 76,
        lineHeight: 1.05,
        letterSpacing: -1.5,
        textTransform: "uppercase",
        color: "white",
        opacity: Math.min(1, enter * 1.5) * (1 - exit),
        transform: `translateY(${(1 - enter) * 50 - exit * 30}px) scale(${0.85 + 0.15 * enter})`,
        textShadow: "0 6px 24px rgba(0,0,0,0.6)",
      }}
    >
      <div>
        {parts.map((p, i) => (
          <span key={i} style={{ color: p.color ?? "white" }}>
            {p.text}
          </span>
        ))}
      </div>
    </div>
  );
};
