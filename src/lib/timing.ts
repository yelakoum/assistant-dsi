import { CalculateMetadataFunction, staticFile } from "remotion";
import { VIDEO_FPS } from "../config";

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

/** Loads public/<videoId>/timing.json (written by generate_audio.py). */
export const loadTiming = async (videoId: string): Promise<Timing> => {
  const res = await fetch(staticFile(`${videoId}/timing.json`), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Could not load public/${videoId}/timing.json (${res.status}). ` +
        `Run: .venv/bin/python generate_audio.py ${videoId}`,
    );
  }
  return (await res.json()) as Timing;
};

export type TimedVideoProps = {
  showTikTokOverlay: boolean;
  /** Injected by calculateMetadata from public/<videoId>/timing.json. */
  timing: Timing | null;
};

/** Sets the composition length from the video's timing.json and passes it as a prop. */
export const timingMetadata = <P extends TimedVideoProps>(
  videoId: string,
): CalculateMetadataFunction<P> => {
  return async ({ props }) => {
    const timing = await loadTiming(videoId);
    if (timing.fps !== VIDEO_FPS) {
      throw new Error(`${videoId}/timing.json was generated at ${timing.fps} fps, composition is ${VIDEO_FPS} fps`);
    }
    return {
      durationInFrames: timing.totalDurationInFrames + END_HOLD_FRAMES,
      props: { ...props, timing },
    };
  };
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
   * Local frame (relative to segment start) where `word` is spoken
   * (its `occurrence`-th match, 1-based), or `fallback` × audio duration
   * if the word is not found. Accents, case, punctuation and French
   * elisions are ignored: "erreur" matches "l'erreur".
   */
  wordFrame: (word: string, fallback: number, occurrence?: number) => number;
};

export const normalizeWord = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^[a-z]{1,2}['’]/, "") // l'erreur -> erreur, qu'il -> il
    .replace(/[^a-z0-9]/g, "");

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
      wordFrame: (word, fallback, occurrence = 1) => {
        const target = normalizeWord(word);
        const hits = segment?.words.filter((w) => normalizeWord(w.text) === target) ?? [];
        const hit = hits[occurrence - 1];
        return hit ? hit.startFrame : Math.round(audioDuration * fallback);
      },
    });
  }
  return windows;
};
