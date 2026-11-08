import { interpolate, spring, SpringConfig } from "remotion";
import { VIDEO_FPS } from "../config";

/** Spring that starts at `frame === 0` and stays at 0 before that. */
export const springIn = (
  frame: number,
  config: Partial<SpringConfig> = { damping: 200 },
  durationInFrames?: number,
) =>
  frame <= 0 ? 0 : spring({ frame, fps: VIDEO_FPS, config, durationInFrames });

export const clampLerp = (
  frame: number,
  input: [number, number],
  output: [number, number],
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
