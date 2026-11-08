// Single source of truth for TikTok video format.
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 60;

export const secondsToFrames = (seconds: number) => Math.ceil(seconds * VIDEO_FPS);
