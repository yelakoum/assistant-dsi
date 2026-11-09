import React from "react";

/** Little hiker drawn with its feet at (0, 0). `walk` (radians) swings the legs. */
export const Hiker: React.FC<{
  x: number;
  y: number;
  walk: number;
  facing: 1 | -1;
  opacity?: number;
  tint?: string;
  scale?: number;
}> = ({ x, y, walk, facing, opacity = 1, tint = "white", scale = 1 }) => {
  const swing = Math.sin(walk) * 0.45;
  const leg = (angle: number) => `M 0 -36 L ${Math.sin(angle) * 24} ${-36 + Math.cos(angle) * 36}`;
  const arm = (angle: number) => `M 0 -62 L ${Math.sin(angle) * 22} ${-62 + Math.cos(angle) * 26}`;
  const stroke = { stroke: tint, strokeWidth: 7, strokeLinecap: "round" as const, fill: "none" };
  const bob = Math.abs(Math.sin(walk)) * 3;

  return (
    <g
      transform={`translate(${x} ${y - bob}) scale(${facing * scale} ${scale})`}
      opacity={opacity}
      style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}
    >
      {/* backpack */}
      <rect x={-22} y={-74} width={16} height={30} rx={5} fill="#ff9f43" />
      <path d={leg(swing)} {...stroke} />
      <path d={leg(-swing)} {...stroke} />
      <path d="M 0 -36 L 0 -70" {...stroke} />
      <path d={arm(-swing * 1.2)} {...stroke} />
      <path d={arm(swing * 1.2 + 0.4)} {...stroke} />
      {/* walking stick */}
      <path d={`M ${16 + swing * 6} -46 L ${24 + swing * 6} 0`} stroke="#c8a26b" strokeWidth={4} strokeLinecap="round" />
      <circle cx={0} cy={-86} r={14} fill={tint} />
      {/* cap */}
      <path d="M -14 -90 Q 0 -108 14 -90 L 22 -88 L -14 -88 Z" fill="#ff4d5e" />
    </g>
  );
};
