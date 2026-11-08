// Render defaults tuned for TikTok uploads.
// Note: config file applies to CLI renders/studio only, not to programmatic renders.
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709"); // keeps output tagged yuv420p (limited range) instead of yuvj420p
Config.setCrf(18);
Config.setAudioBitrate("320k");
Config.setOverwriteOutput(true);
