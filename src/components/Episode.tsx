import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { SegmentWindow, Timing } from "../lib/timing";
import { COLORS, FONT_UI } from "../theme";
import { Background } from "./Background";
import { SceneTitle, TitlePart } from "./SceneTitle";
import { Subtitles } from "./Subtitles";
import { TikTokSafeArea } from "./TikTokSafeArea";
import { Watermark } from "./Watermark";

/** Shared frame of every episode: background, voiceover, headlines, watermark, subtitles. */
export const EpisodeShell: React.FC<{
  timing: Timing;
  seg: SegmentWindow[];
  titles: TitlePart[][];
  durationInFrames: number;
  showTikTokOverlay: boolean;
  watermark: string;
  children: React.ReactNode;
}> = ({ timing, seg, titles, durationInFrames, showTikTokOverlay, watermark, children }) => (
  <AbsoluteFill>
    <Background />
    {timing.segments.map((s) => (
      <Sequence key={s.id} name={`Voix ${s.id}`} from={s.startFrame} durationInFrames={s.durationInFrames}>
        <Html5Audio src={staticFile(s.audioFile)} />
      </Sequence>
    ))}
    <TikTokSafeArea showTikTokOverlay={showTikTokOverlay}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 170 }}>
        {titles.map((parts, i) => (
          <SceneTitle
            key={i}
            parts={parts}
            fontSize={62}
            start={seg[i].start}
            end={seg[i + 1]?.start ?? durationInFrames}
            isLast={i === titles.length - 1}
          />
        ))}
      </div>
      {children}
      <Watermark text={watermark} />
      <Subtitles timing={timing} />
    </TikTokSafeArea>
  </AbsoluteFill>
);

/** Rounded call-out (series badge, "Demain : …", "Abonne-toi"…). */
export const Pill: React.FC<{
  text: React.ReactNode;
  color: string;
  amount: number;
  textColor?: string;
  fontSize?: number;
}> = ({ text, color, amount, textColor = "#0b0b0b", fontSize = 34 }) =>
  amount > 0 ? (
    <div
      style={{
        alignSelf: "center",
        padding: "12px 30px",
        borderRadius: 18,
        backgroundColor: color,
        color: textColor,
        fontFamily: FONT_UI,
        fontWeight: 900,
        fontSize,
        letterSpacing: 1,
        textAlign: "center",
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.7 + 0.3 * amount})`,
      }}
    >
      {text}
    </div>
  ) : null;

/** "ML EN 1 MINUTE · #n" — the series brand shown in every hook. */
export const SeriesBadge: React.FC<{ episode: number; topic: string; amount: number }> = ({ episode, topic, amount }) =>
  amount > 0 ? (
    <div
      style={{
        alignSelf: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.75 + 0.25 * amount})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 26px",
          borderRadius: 18,
          backgroundColor: COLORS.yellow,
          color: "#0b0b0b",
          fontFamily: FONT_UI,
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: 1.5,
        }}
      >
        ML EN 1 MINUTE
        <span style={{ padding: "2px 14px", borderRadius: 12, backgroundColor: "#0b0b0b", color: COLORS.yellow }}>
          #{episode}
        </span>
      </div>
      <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 44, color: "white", letterSpacing: 1 }}>{topic}</div>
    </div>
  ) : null;
