import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const blob = (x: number, y: number, size: number, color: string): React.CSSProperties => ({
    position: "absolute",
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
  });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0b1020 0%, #070910 60%, #05060a 100%)" }}>
      <div style={blob(250 + Math.sin(t * 0.6) * 120, 520 + Math.cos(t * 0.5) * 140, 1100, "rgba(55, 118, 171, 0.35)")} />
      <div style={blob(850 + Math.cos(t * 0.5) * 120, 1300 + Math.sin(t * 0.7) * 160, 1100, "rgba(255, 212, 59, 0.14)")} />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: `0 ${(frame * 0.4) % 60}px`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
