import React from "react";
import { AbsoluteFill, getRemotionEnvironment } from "remotion";

/** Pixel insets (on a 1080x1920 canvas) covered by TikTok's UI. */
export const TIKTOK_SAFE_AREA = {
  top: 160, // top bar (Following / For You, search, LIVE)
  bottom: 380, // username, caption, music ticker
  right: 140, // like / comment / bookmark / share buttons
  left: 40,
} as const;

type TikTokSafeAreaProps = {
  children?: React.ReactNode;
  /**
   * Draw semi-transparent red boxes over the forbidden zones.
   * Defaults to true in Studio/Player preview. Always forced off
   * during `remotion render`, so it can never leak into the final video.
   */
  showTikTokOverlay?: boolean;
  /** Style for the inner content box (e.g. flex alignment). */
  style?: React.CSSProperties;
};

const overlayZone: React.CSSProperties = {
  position: "absolute",
  backgroundColor: "rgba(255, 0, 0, 0.35)",
  outline: "2px dashed rgba(255, 0, 0, 0.9)",
  outlineOffset: -2,
  color: "white",
  fontFamily: "sans-serif",
  fontSize: 28,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textShadow: "0 0 6px black",
  pointerEvents: "none",
};

const TikTokOverlay: React.FC = () => {
  const { top, bottom, right, left } = TIKTOK_SAFE_AREA;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 9999 }}>
      <div style={{ ...overlayZone, top: 0, left: 0, right: 0, height: top }}>
        TOP BAR
      </div>
      <div style={{ ...overlayZone, bottom: 0, left: 0, right: 0, height: bottom }}>
        USERNAME · CAPTION · MUSIC
      </div>
      {/* Side zones span only between top and bottom zones to avoid double-tinting corners. */}
      <div
        style={{
          ...overlayZone,
          top,
          bottom,
          right: 0,
          width: right,
          writingMode: "vertical-rl",
        }}
      >
        LIKE · COMMENT · SHARE
      </div>
      <div style={{ ...overlayZone, top, bottom, left: 0, width: left }} />
    </AbsoluteFill>
  );
};

export const TikTokSafeArea: React.FC<TikTokSafeAreaProps> = ({
  children,
  showTikTokOverlay = true,
  style,
}) => {
  const { isRendering } = getRemotionEnvironment();
  const { top, bottom, right, left } = TIKTOK_SAFE_AREA;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          top,
          bottom,
          left,
          right,
          width: "auto",
          height: "auto",
          ...style,
        }}
      >
        {children}
      </AbsoluteFill>
      {showTikTokOverlay && !isRendering ? <TikTokOverlay /> : null}
    </AbsoluteFill>
  );
};
