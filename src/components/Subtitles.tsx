import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { springIn } from "../lib/anim";
import type { Timing, Word } from "../lib/timing";
import { COLORS, FONT_UI } from "../theme";

const MAX_WORDS_PER_CHUNK = 3;
const MAX_CHARS_PER_CHUNK = 15;
const MAX_FONT_SIZE = 72;
/** Usable width inside the safe area (900px) minus a small margin. */
const MAX_LINE_WIDTH = 820;
/** Approx. width of an uppercase Montserrat Black glyph, in em. */
const GLYPH_EM = 0.95;
/** Pause (frames) between words that forces a new chunk. */
const BREAK_GAP = 10;
/** Words at least this long get a chunk of their own. */
const SOLO_WORD_LENGTH = 10;
/** How long the last chunk lingers after its last word ends. */
const LINGER = 18;

type Chunk = { words: Word[]; start: number; end: number };

const buildChunks = (words: Word[]): Chunk[] => {
  const chunks: Chunk[] = [];
  let current: Word[] = [];
  const flush = () => {
    if (current.length) {
      chunks.push({ words: current, start: current[0].startFrame, end: current[current.length - 1].endFrame });
    }
    current = [];
  };
  for (const raw of words) {
    const w = { ...raw, text: raw.text.replace(/^[^\w']+|[^\w']+$/g, "") };
    if (!w.text) continue;
    const prev = current[current.length - 1];
    const chars = current.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    if (
      current.length >= MAX_WORDS_PER_CHUNK ||
      chars > MAX_CHARS_PER_CHUNK ||
      (prev && w.startFrame - prev.endFrame > BREAK_GAP) ||
      (prev && (w.text.length >= SOLO_WORD_LENGTH || prev.text.length >= SOLO_WORD_LENGTH))
    ) {
      flush();
    }
    current.push(w);
  }
  flush();
  // Each chunk stays until the next one starts (or lingers briefly at the end).
  return chunks.map((c, i) => ({
    ...c,
    end: chunks[i + 1] ? chunks[i + 1].start : c.end + LINGER,
  }));
};

/**
 * TikTok-style word-by-word captions. Place at the bottom of <TikTokSafeArea>
 * so they sit right above the 380px bottom UI zone.
 */
export const Subtitles: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();

  const segmentChunks = useMemo(
    () => timing.segments.map((s) => ({ segment: s, chunks: buildChunks(s.words) })),
    [timing],
  );

  let active: { chunk: Chunk; local: number } | null = null;
  for (const { segment, chunks } of segmentChunks) {
    const local = frame - segment.startFrame;
    const chunk = chunks.find((c) => local >= c.start && local < c.end);
    if (chunk) {
      active = { chunk, local };
      break;
    }
  }
  if (!active) return null;

  const { chunk, local } = active;
  // Shrink long chunks (e.g. "COMPREHENSION") so they never leave the safe area.
  const chars = chunk.words.reduce((n, w) => n + w.text.length, 0) + (chunk.words.length - 1);
  const fontSize = Math.min(MAX_FONT_SIZE, MAX_LINE_WIDTH / (chars * GLYPH_EM));
  const pop = springIn(local - chunk.start + 1, { damping: 11, stiffness: 220 });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 10,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        columnGap: fontSize * 0.45,
        textAlign: "center",
        fontFamily: FONT_UI,
        fontWeight: 900,
        fontSize,
        lineHeight: 1.1,
        textTransform: "uppercase",
        transform: `scale(${0.75 + 0.25 * pop})`,
        transformOrigin: "50% 100%",
      }}
    >
      {chunk.words.map((w, i) => {
        const next = chunk.words[i + 1];
        const isCurrent = local >= w.startFrame && (!next || local < next.startFrame);
        const wordPop = isCurrent ? springIn(local - w.startFrame + 1, { damping: 10, stiffness: 260 }) : 0;
        return (
          <span
            key={`${chunk.start}-${i}`}
            style={{
              display: "inline-block",
              color: isCurrent ? COLORS.yellow : "white",
              WebkitTextStroke: "14px black",
              paintOrder: "stroke fill",
              textShadow: "0 8px 0 rgba(0,0,0,0.55)",
              transform: `scale(${isCurrent ? 1 + 0.08 * wordPop : 1})`,
              transformOrigin: "50% 100%",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
