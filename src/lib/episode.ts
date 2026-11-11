import { clampLerp, springIn } from "./anim";
import { getSegmentWindows, SegmentWindow, Timing } from "./timing";

/** Content top inside <TikTokSafeArea>, below the headline. */
export const CONTENT_TOP = 180;

/** Animation helpers bound to the current frame and a video's timing. */
export const episodeTools = (frame: number, timing: Timing, durationInFrames: number, segmentCount: number) => {
  const seg = getSegmentWindows(timing, durationInFrames, segmentCount);
  /** Absolute frame where `word` is spoken in segment `w`. */
  const at = (w: SegmentWindow, word: string, fallback: number, occurrence?: number) =>
    w.start + w.wordFrame(word, fallback, occurrence);
  const sp = (start: number, config?: Parameters<typeof springIn>[1], duration?: number) =>
    springIn(frame - start, config, duration);
  /** Bouncy entrance. */
  const pop = (start: number) => sp(start, { damping: 13, stiffness: 170 });
  /** Smooth 0→1 without overshoot. */
  const ease = (start: number, duration = 15) => sp(start, { damping: 200 }, duration);
  const fadeOut = (start: number, length = 15) => clampLerp(frame, [start, start + length], [1, 0]);

  /** Scene container: springs in at `start`, cross-fades out after `end`. */
  const scene = (start: number, end: number, top = CONTENT_TOP) => {
    const enter = sp(start, { damping: 18, stiffness: 120 });
    const exit = clampLerp(frame, [end, end + 14], [0, 1]);
    return {
      visible: frame >= start && frame < end + 14,
      style: {
        position: "absolute" as const,
        top,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column" as const,
        gap: 16,
        opacity: Math.min(1, enter * 1.4) * (1 - exit),
        transform: `translateY(${(1 - enter) * 90}px)`,
      },
    };
  };

  return { seg, at, sp, pop, ease, fadeOut, scene };
};
