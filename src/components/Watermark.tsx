import React from "react";
import { useCurrentFrame } from "remotion";
import { clampLerp } from "../lib/anim";
import { COLORS, FONT_UI } from "../theme";

/** Seconds the watermark stays in one corner before moving to the other. */
const SWITCH_EVERY_FRAMES = 600;
const FADE_FRAMES = 20;
/**
 * Distance from the bottom of the safe area: above the one-line subtitles,
 * below the scene content, so it never hides anything important.
 */
const BOTTOM_OFFSET = 110;

/**
 * Semi-transparent creator watermark. It alternates between the bottom-left
 * and bottom-right corners so it can't be removed with one static crop/blur.
 * Render it inside <TikTokSafeArea> so TikTok's UI never covers it.
 */
export const Watermark: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  const slot = Math.floor(frame / SWITCH_EVERY_FRAMES);
  const local = frame - slot * SWITCH_EVERY_FRAMES;
  const fadeIn = slot === 0 ? 1 : clampLerp(local, [0, FADE_FRAMES], [0, 1]);
  const fadeOut = clampLerp(local, [SWITCH_EVERY_FRAMES - FADE_FRAMES, SWITCH_EVERY_FRAMES], [1, 0]);
  const onLeft = slot % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: BOTTOM_OFFSET,
        ...(onLeft ? { left: 8 } : { right: 8 }),
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 18px 8px 12px",
        borderRadius: 30,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        border: "1.5px solid rgba(255, 255, 255, 0.22)",
        opacity: 0.75 * Math.min(fadeIn, fadeOut),
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: COLORS.yellow,
          color: "#0b0b0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_UI,
          fontWeight: 900,
          fontSize: 15,
          letterSpacing: -0.5,
        }}
      >
        ML
      </div>
      <span
        style={{
          fontFamily: FONT_UI,
          fontWeight: 800,
          fontSize: 26,
          color: "white",
          letterSpacing: 0.5,
          textShadow: "0 2px 6px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </span>
    </div>
  );
};
