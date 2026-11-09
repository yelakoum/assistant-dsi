import React from "react";
import { useCurrentFrame } from "remotion";
import { HighlightedCode } from "../lib/syntax";
import { CODE_FONT_SIZE, CODE_LINE_HEIGHT, COLORS, FONT_CODE, FONT_UI } from "../theme";

export type CodeLineState = {
  key: string;
  code: string;
  lineNumber: number;
  /** Characters typed so far (default: all). */
  visibleChars?: number;
  /** 0..1 — row height factor, used to grow/collapse lines smoothly. */
  height?: number;
  opacity?: number;
  /** Horizontal offset in px (e.g. slide-out). */
  offsetX?: number;
  blur?: number;
  highlight?: { amount: number; color: string };
  badge?: { text: string; color: string; amount: number };
  showCursor?: boolean;
  /** Solid cursor while typing, blinking otherwise. */
  cursorBlink?: boolean;
};

const hexToRgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const PythonIcon: React.FC = () => (
  <svg width="30" height="30" viewBox="0 0 32 32">
    <path d="M15.9 2c-7.1 0-6.7 3.1-6.7 3.1v3.2h6.8v1H6.6S2 8.8 2 16s4 6.9 4 6.9h2.4v-3.3s-.1-4 4-4h6.7s3.8.1 3.8-3.7V5.6S23.5 2 15.9 2zm-3.7 2.1a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" fill="#3b77a8" />
    <path d="M16.1 30c7.1 0 6.7-3.1 6.7-3.1v-3.2H16v-1h9.4S30 23.2 30 16s-4-6.9-4-6.9h-2.4v3.3s.1 4-4 4h-6.7s-3.8-.1-3.8 3.7v6.3S8.5 30 16.1 30zm3.7-2.1a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z" fill="#ffd43b" />
  </svg>
);

const CodeRow: React.FC<{ line: CodeLineState; frame: number; fontSize: number; lineHeight: number }> = ({
  line,
  frame,
  fontSize,
  lineHeight,
}) => {
  const height = line.height ?? 1;
  const highlight = line.highlight?.amount ?? 0;
  const badge = line.badge;
  const cursorOn = line.cursorBlink ? frame % 60 < 32 : true;

  return (
    <div
      style={{
        position: "relative",
        height: lineHeight * height,
        opacity: line.opacity ?? 1,
        overflow: "hidden",
        filter: line.blur ? `blur(${line.blur}px)` : undefined,
      }}
    >
      {highlight > 0 && line.highlight ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: hexToRgba(line.highlight.color, 0.18 * highlight),
            borderLeft: `6px solid ${hexToRgba(line.highlight.color, highlight)}`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: lineHeight,
          transform: `translateX(${line.offsetX ?? 0}px)`,
        }}
      >
        <div
          style={{
            width: 64,
            paddingRight: 24,
            textAlign: "right",
            color: line.showCursor ? COLORS.gutterActive : COLORS.gutter,
            flexShrink: 0,
          }}
        >
          {line.lineNumber}
        </div>
        <div style={{ whiteSpace: "pre", display: "flex", alignItems: "center" }}>
          <HighlightedCode code={line.code} visibleChars={line.visibleChars} />
          {line.showCursor ? (
            <span
              style={{
                display: "inline-block",
                width: 4,
                height: fontSize * 1.15,
                marginLeft: 2,
                backgroundColor: "#aeafad",
                opacity: cursorOn ? 1 : 0,
              }}
            />
          ) : null}
        </div>
        {badge && badge.amount > 0 ? (
          <div
            style={{
              marginLeft: "auto",
              marginRight: 20,
              padding: "4px 14px",
              borderRadius: 10,
              backgroundColor: badge.color,
              color: "#0b0b0b",
              fontFamily: FONT_UI,
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: 1,
              opacity: Math.min(1, badge.amount),
              transform: `scale(${0.6 + 0.4 * badge.amount})`,
            }}
          >
            {badge.text}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const CodeWindow: React.FC<{
  lines: CodeLineState[];
  fileName?: string;
  statusText?: string;
  fontSize?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({
  lines,
  fileName = "main.py",
  statusText = "",
  fontSize = CODE_FONT_SIZE,
  lineHeight = CODE_LINE_HEIGHT,
  style,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 26,
        overflow: "hidden",
        backgroundColor: COLORS.editorBg,
        border: `2px solid ${COLORS.border}`,
        boxShadow: "0 40px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
        ...style,
      }}
    >
      {/* Title bar + tab */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          height: 74,
          backgroundColor: COLORS.titleBarBg,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 12, padding: "0 24px", alignSelf: "center" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c }} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 60,
            padding: "0 28px",
            backgroundColor: COLORS.editorBg,
            borderTop: `3px solid ${COLORS.statusBar}`,
            color: "#ffffff",
            fontFamily: FONT_UI,
            fontWeight: 600,
            fontSize: 26,
          }}
        >
          <PythonIcon />
          {fileName}
        </div>
      </div>

      {/* Code */}
      <div
        style={{
          padding: "26px 0",
          fontFamily: FONT_CODE,
          fontSize,
          color: COLORS.text,
        }}
      >
        {lines.map((line) => (
          <CodeRow key={line.key} line={line} frame={frame} fontSize={fontSize} lineHeight={lineHeight} />
        ))}
      </div>

      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 40,
          padding: "0 20px",
          backgroundColor: COLORS.statusBar,
          color: "white",
          fontFamily: FONT_UI,
          fontWeight: 600,
          fontSize: 19,
        }}
      >
        <span>main</span>
        <span>{statusText}</span>
      </div>
    </div>
  );
};
