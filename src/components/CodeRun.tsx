import React from "react";
import { useCurrentFrame } from "remotion";
import { clampLerp, springIn } from "../lib/anim";
import { CodeLineState, CodeWindow } from "./CodeWindow";
import { Terminal } from "./Terminal";

export type CodeRunLine = {
  code: string;
  /** Frame at which typing of this line starts. */
  typeAt: number;
  /** Frames per typed character (default 0.55). */
  fpc?: number;
  /** Frame at which this line collapses (editor "scrolls" past it). */
  collapseAt?: number;
  highlight?: { from: number; to: number; color: string; badge?: string };
};

export type CodeRunTerminal = {
  at: number;
  command: string;
  outputs: { text: string; at: number; color?: string }[];
};

const indentOf = (s: string) => s.length - s.trimStart().length;

/** Lays typing start frames back to back from `start`; `anchors` delays a line to at least a given frame. */
export const scheduleTyping = (
  codes: string[],
  start: number,
  fpc = 0.55,
  anchors: Record<number, number> = {},
): number[] => {
  const starts: number[] = [];
  let cursor = start;
  codes.forEach((code, i) => {
    const s = Math.max(cursor, anchors[i] ?? -Infinity);
    starts.push(s);
    cursor = s + code.trim().length * fpc + 3;
  });
  return starts;
};

/** VS Code editor that types `lines`, then optionally runs them in a terminal. */
export const CodeRun: React.FC<{
  lines: CodeRunLine[];
  fileName: string;
  statusText?: string;
  terminal?: CodeRunTerminal;
  fontSize?: number;
  lineHeight?: number;
}> = ({ lines, fileName, statusText = "Python 3.12   scikit-learn 1.9", terminal, fontSize = 34, lineHeight = 54 }) => {
  const frame = useCurrentFrame();

  const typed = (l: CodeRunLine) => {
    const indent = indentOf(l.code);
    const n = l.code.length - indent;
    const fpc = l.fpc ?? 0.55;
    const c = Math.floor(clampLerp(frame, [l.typeAt, l.typeAt + n * fpc], [0, n]));
    return c > 0 ? indent + c : 0;
  };

  let current = -1;
  lines.forEach((l, i) => {
    if (frame >= l.typeAt) current = i;
  });
  const busy = current >= 0 && typed(lines[current]) < lines[current].code.length;
  const cursorVisible = !terminal || frame < terminal.at;

  const editorLines: CodeLineState[] = lines.map((l, i) => {
    const grow = i === 0 ? 1 : springIn(frame - l.typeAt, { damping: 200 }, 8);
    const collapse = l.collapseAt === undefined ? 0 : springIn(frame - l.collapseAt, { damping: 200 }, 30);
    const h = l.highlight;
    const glow = h ? springIn(frame - h.from, { damping: 200 }, 12) * clampLerp(frame, [h.to, h.to + 15], [1, 0]) : 0;
    return {
      key: `line-${i}`,
      code: l.code,
      lineNumber: i + 1,
      visibleChars: typed(l),
      height: grow * (1 - collapse),
      opacity: 1 - Math.min(1, collapse * 1.6),
      highlight: h ? { amount: glow, color: h.color } : undefined,
      badge: h?.badge ? { text: h.badge, color: h.color, amount: glow } : undefined,
      showCursor: cursorVisible && i === current,
      cursorBlink: !busy,
    };
  });

  let terminalNode: React.ReactNode = null;
  if (terminal && frame >= terminal.at) {
    const tIn = springIn(frame - terminal.at, { damping: 16, stiffness: 140 });
    const cmdChars = Math.floor(
      clampLerp(frame, [terminal.at + 6, terminal.at + 6 + terminal.command.length * 0.8], [0, terminal.command.length]),
    );
    terminalNode = (
      <Terminal
        command={terminal.command}
        commandChars={cmdChars}
        fontSize={30}
        output={terminal.outputs.map((o) => ({
          text: o.text,
          color: o.color,
          amount: Math.min(1, springIn(frame - o.at, { damping: 12, stiffness: 180 })),
        }))}
        style={{ opacity: Math.min(1, tIn * 1.5), transform: `translateY(${(1 - tIn) * 100}px)` }}
      />
    );
  }

  return (
    <>
      <CodeWindow lines={editorLines} fileName={fileName} statusText={statusText} fontSize={fontSize} lineHeight={lineHeight} />
      {terminalNode}
    </>
  );
};

/** Frame when the terminal command has finished typing (outputs should come after). */
export const commandDoneAt = (terminalAt: number, command: string) => terminalAt + 6 + command.length * 0.8;
