import React from "react";
import { COLORS, FONT_CODE, FONT_UI } from "../theme";

export type TerminalOutputLine = {
  text: string;
  /** 0..1 reveal of this output line. */
  amount: number;
  color?: string;
};

export const Terminal: React.FC<{
  command: string;
  commandChars: number;
  output: TerminalOutputLine[];
  fontSize?: number;
  style?: React.CSSProperties;
}> = ({ command, commandChars, output, fontSize = 34, style }) => {
  const typing = commandChars < command.length;
  const waiting = output.every((o) => o.amount === 0);
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: COLORS.terminalBg,
        border: `2px solid ${COLORS.border}`,
        boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 34,
          padding: "14px 28px 0",
          borderBottom: `1px solid ${COLORS.border}`,
          fontFamily: FONT_UI,
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: 1.5,
          color: "#8b8b8b",
        }}
      >
        <span>PROBLEMS</span>
        <span>OUTPUT</span>
        <span style={{ color: "white", borderBottom: "3px solid white", paddingBottom: 10 }}>
          TERMINAL
        </span>
      </div>
      <div style={{ padding: "18px 28px 22px", fontFamily: FONT_CODE, fontSize, lineHeight: 1.45 }}>
        <div style={{ whiteSpace: "pre" }}>
          <span style={{ color: COLORS.green }}>$ </span>
          <span style={{ color: "#e6e6e6" }}>{command.slice(0, commandChars)}</span>
          {typing || waiting ? (
            <span
              style={{
                display: "inline-block",
                width: fontSize * 0.53,
                height: fontSize * 1.05,
                verticalAlign: "middle",
                backgroundColor: "#e6e6e6",
              }}
            />
          ) : null}
        </div>
        {output.map((line, i) => (
          <div
            key={i}
            style={{
              whiteSpace: "pre",
              color: line.color ?? COLORS.green,
              fontWeight: 700,
              opacity: line.amount,
              transform: `translateY(${(1 - line.amount) * 16}px)`,
              textShadow: `0 0 ${24 * line.amount}px rgba(61, 220, 132, 0.6)`,
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
};
