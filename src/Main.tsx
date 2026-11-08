import "./fonts";
import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { CodeLineState, CodeWindow } from "./components/CodeWindow";
import { SceneTitle } from "./components/SceneTitle";
import { Subtitles } from "./components/Subtitles";
import { TakeawayCard } from "./components/TakeawayCard";
import { Terminal } from "./components/Terminal";
import { TikTokSafeArea } from "./components/TikTokSafeArea";
import { clampLerp, springIn } from "./lib/anim";
import { getSegmentWindows, Timing } from "./lib/timing";
import { COLORS } from "./theme";

export type MainProps = {
  showTikTokOverlay: boolean;
  /** Injected by calculateMetadata from public/timing.json. */
  timing: Timing | null;
};

const LOOP_LINES = [
  "nums = [1, 2, 3, 4, 5]",
  "doubled = []",
  "for x in nums:",
  "    doubled.append(x * 2)",
];
const COMPREHENSION_LINE = "doubled = [x*2 for x in nums]";
const PRINT_LINE = "print(doubled)";
const TERMINAL_COMMAND = "python main.py";
const TERMINAL_OUTPUT = "[2, 4, 6, 8, 10]";

const TITLE_AREA_HEIGHT = 200;
const CONTENT_TOP = 220;

const indentOf = (s: string) => s.length - s.trimStart().length;

export const Main: React.FC<MainProps> = ({ showTikTokOverlay, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (!timing) {
    return <AbsoluteFill style={{ backgroundColor: "black" }} />;
  }

  const [s1, s2, s3, s4] = getSegmentWindows(timing, durationInFrames, 4);

  // ---- Segment 1: type the 4-line for loop ---------------------------------
  const typeStart = s1.start + 12;
  const typeEnd = s1.start + Math.max(40, Math.round(s1.audioDuration * 0.85));
  const typeable = LOOP_LINES.map((l) => l.length - indentOf(l));
  const totalChars = typeable.reduce((a, b) => a + b, 0);
  const offsets = typeable.map((_, i) => typeable.slice(0, i).reduce((a, b) => a + b, 0));
  const typed = Math.floor(clampLerp(frame, [typeStart, typeEnd], [0, totalChars]));
  const isTyping = typed < totalChars;
  const lineStartFrame = (i: number) => typeStart + (offsets[i] / totalChars) * (typeEnd - typeStart);
  const currentTypingLine = offsets.reduce((acc, off, i) => (typed >= off ? i : acc), 0);

  // ---- Segment 2: highlight + collapse into a list comprehension -----------
  const f2 = frame - s2.start;
  const collapseAt = s2.wordFrame("collapse", 0.25);
  const redHighlight = springIn(f2, { damping: 200 }, 15);
  const collapse = springIn(f2 - collapseAt, { damping: 200 }, 42);
  const greenFadeOut = clampLerp(frame, [s3.start, s3.start + 24], [1, 0]);
  const greenHighlight = springIn(f2 - collapseAt - 24, { damping: 200 }, 15) * greenFadeOut;
  const oneLineBadge = springIn(f2 - collapseAt - 22, { damping: 12, stiffness: 200 }) * greenFadeOut;
  const windowPulse = 1 + 0.03 * Math.sin(Math.PI * collapse);

  // ---- Segment 3: print + run in the terminal -------------------------------
  const f3 = frame - s3.start;
  const printHeight = springIn(f3, { damping: 200 }, 14);
  const printChars = Math.floor(clampLerp(f3, [6, 6 + PRINT_LINE.length * 1.5], [0, PRINT_LINE.length]));
  const terminalAt = Math.max(16, s3.wordFrame("run", 0) + 10);
  const terminalIn = springIn(f3 - terminalAt, { damping: 16, stiffness: 140 });
  const commandChars = Math.floor(
    clampLerp(f3, [terminalAt + 6, terminalAt + 6 + TERMINAL_COMMAND.length * 1.4], [0, TERMINAL_COMMAND.length]),
  );
  const outputAt = Math.max(terminalAt + 30, s3.wordFrame("output", 0.45));
  const outputIn = Math.min(1, springIn(f3 - outputAt, { damping: 12, stiffness: 180 }));
  // Keep the content block vertically centred as the terminal/cards appear.
  const contentShift =
    260 -
    130 * springIn(f3, { damping: 200 }, 30) -
    130 * springIn(frame - s4.start, { damping: 200 }, 30);

  // ---- Build the editor lines for the current frame -------------------------
  const inSeg1 = frame < s2.start;
  const lines: CodeLineState[] = [
    {
      key: "nums",
      code: LOOP_LINES[0],
      lineNumber: 1,
      visibleChars: Math.min(typeable[0], typed),
      showCursor: inSeg1 && currentTypingLine === 0,
      cursorBlink: !isTyping,
    },
  ];

  if (collapse < 1) {
    for (let i = 1; i < LOOP_LINES.length; i++) {
      const indent = indentOf(LOOP_LINES[i]);
      const started = typed >= offsets[i];
      lines.push({
        key: `loop-${i}`,
        code: LOOP_LINES[i],
        lineNumber: i + 1,
        visibleChars: started ? indent + Math.min(typeable[i], typed - offsets[i]) : 0,
        height: started ? springIn(frame - lineStartFrame(i), { damping: 200 }, 10) * (1 - collapse) : 0,
        opacity: 1 - Math.min(1, collapse * 1.6),
        offsetX: -70 * collapse,
        blur: collapse * 8,
        highlight: { amount: redHighlight, color: COLORS.red },
        badge: i === 1 ? { text: "3 LINES", color: COLORS.red, amount: redHighlight * (1 - collapse) } : undefined,
        showCursor: (inSeg1 && currentTypingLine === i) || (!inSeg1 && i === 3 && collapse === 0),
        cursorBlink: !isTyping,
      });
    }
  }

  if (collapse > 0) {
    lines.push({
      key: "comprehension",
      code: COMPREHENSION_LINE,
      lineNumber: 2,
      height: collapse,
      opacity: clampLerp(collapse, [0.35, 1], [0, 1]),
      offsetX: 70 * (1 - collapse),
      highlight: { amount: greenHighlight, color: COLORS.green },
      badge: { text: "1 LINE", color: COLORS.green, amount: oneLineBadge },
      showCursor: frame < s3.start && collapse > 0.9,
      cursorBlink: true,
    });
  }

  if (frame >= s3.start) {
    lines.push({
      key: "print",
      code: PRINT_LINE,
      lineNumber: 3,
      height: printHeight,
      visibleChars: printChars,
      showCursor: printChars < PRINT_LINE.length || f3 < terminalAt,
      cursorBlink: printChars >= PRINT_LINE.length,
    });
  }

  return (
    <AbsoluteFill>
      <Background />

      {timing.segments.map((seg) => (
        <Sequence key={seg.id} name={`Voice ${seg.id}`} from={seg.startFrame} durationInFrames={seg.durationInFrames}>
          <Html5Audio src={staticFile(seg.audioFile)} />
        </Sequence>
      ))}

      <TikTokSafeArea showTikTokOverlay={showTikTokOverlay}>
        {/* Headlines */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: TITLE_AREA_HEIGHT }}>
          <SceneTitle start={s1.start} end={s2.start} parts={[{ text: "Stop ", color: COLORS.red }, { text: "writing loops like this" }]} />
          <SceneTitle start={s2.start} end={s3.start} parts={[{ text: "Make it " }, { text: "one line", color: COLORS.green }]} />
          <SceneTitle start={s3.start} end={s4.start} parts={[{ text: "Same result, " }, { text: "less code", color: COLORS.yellow }]} />
          <SceneTitle start={s4.start} end={durationInFrames} isLast parts={[{ text: "Why it's " }, { text: "better", color: COLORS.yellow }]} />
        </div>

        {/* Editor, terminal, takeaways */}
        <div
          style={{
            position: "absolute",
            top: CONTENT_TOP,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            transform: `translateY(${contentShift}px)`,
          }}
        >
          <CodeWindow lines={lines} statusText="Python 3.12   UTF-8" style={{ transform: `scale(${windowPulse})` }} />

          {frame >= s3.start ? (
            <Terminal
              command={TERMINAL_COMMAND}
              commandChars={commandChars}
              output={TERMINAL_OUTPUT}
              outputAmount={outputIn}
              style={{
                opacity: Math.min(1, terminalIn * 1.5),
                transform: `translateY(${(1 - terminalIn) * 120}px)`,
              }}
            />
          ) : null}

          {frame >= s4.start ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <TakeawayCard at={s4.start + s4.wordFrame("cleaner", 0.05)} color={COLORS.yellow} label="CLEANER" detail="3 lines → 1 line" />
              <TakeawayCard at={s4.start + s4.wordFrame("pythonic", 0.25)} color={COLORS.blue} label="PYTHONIC" detail="Reads like plain English" />
              <TakeawayCard at={s4.start + s4.wordFrame("faster", 0.45)} color={COLORS.green} label="FASTER" detail="No .append() call per item" />
            </div>
          ) : null}
        </div>

        <Subtitles timing={timing} />
      </TikTokSafeArea>
    </AbsoluteFill>
  );
};
