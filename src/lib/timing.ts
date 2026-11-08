import { staticFile } from "remotion";

export type Word = { text: string; startFrame: number; endFrame: number };

export type Segment = {
  id: number;
  text: string;
  audioFile: string;
  startFrame: number;
  durationInFrames: number;
  durationSeconds: number;
  words: Word[];
};

export type Timing = {
  fps: number;
  gapFrames: number;
  totalDurationInFrames: number;
  totalDurationSeconds: number;
  segments: Segment[];
};

/** Frames held on the last shot after the voiceover ends. */
export const END_HOLD_FRAMES = 45;

export const loadTiming = async (): Promise<Timing> => {
  const res = await fetch(staticFile("timing.json"), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Could not load public/timing.json (${res.status}). Run: .venv/bin/python generate_audio.py`,
    );
  }
  return (await res.json()) as Timing;
};

export type SegmentWindow = {
  /** Absolute frame where the segment starts. */
  start: number;
  /** Absolute frame where the next segment starts (or the video ends). */
  end: number;
  /** Length of the spoken audio in frames. */
  audioDuration: number;
  segment: Segment | undefined;
  /**
   * Local frame (relative to segment start) where `word` is spoken,
   * or `fallback` × audio duration if the word is not found.
   */
  wordFrame: (word: string, fallback: number) => number;
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export const getSegmentWindows = (timing: Timing, totalFrames: number, count: number) => {
  const windows: SegmentWindow[] = [];
  for (let i = 0; i < count; i++) {
    const segment = timing.segments[i];
    const next = timing.segments[i + 1];
    const start = segment?.startFrame ?? totalFrames;
    const audioDuration = segment?.durationInFrames ?? 0;
    windows.push({
      start,
      end: next?.startFrame ?? totalFrames,
      audioDuration,
      segment,
      wordFrame: (word, fallback) => {
        const hit = segment?.words.find((w) => normalize(w.text) === normalize(word));
        return hit ? hit.startFrame : Math.round(audioDuration * fallback);
      },
    });
  }
  return windows;
};
