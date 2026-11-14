import React from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";

/** Sound effects synthesised with ffmpeg (public/sfx/*.wav, original, royalty-free). */
export type SfxName = "pop" | "whoosh" | "typing" | "ding" | "tick";
export type SfxEvent = { at: number; sound: SfxName; volume?: number; duration?: number };

const DEFAULTS: Record<SfxName, { volume: number; duration: number }> = {
  pop: { volume: 0.7, duration: 12 },
  whoosh: { volume: 0.4, duration: 30 },
  typing: { volume: 0.45, duration: 60 },
  ding: { volume: 0.4, duration: 54 },
  tick: { volume: 0.55, duration: 6 },
};

/** Collects cues while the scene computes its animations; `cue` returns `at` so it can wrap a trigger frame. */
export const createCues = () => {
  const events: SfxEvent[] = [];
  const cue = (at: number, sound: SfxName, opts: { volume?: number; duration?: number } = {}) => {
    events.push({ at: Math.max(0, Math.round(at)), sound, ...opts });
    return at;
  };
  return { events, cue };
};

/** Plays every cue under the voiceover (typing loops for its duration). */
export const SfxTrack: React.FC<{ events: SfxEvent[] }> = ({ events }) => {
  const seen = new Set<string>();
  return (
    <>
      {events.map((e) => {
        const key = `${e.sound}-${e.at}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const d = DEFAULTS[e.sound];
        const duration = Math.max(1, Math.round(e.duration ?? d.duration));
        return (
          <Sequence key={key} name={`sfx ${e.sound}`} from={e.at} durationInFrames={duration} layout="none">
            <Html5Audio src={staticFile(`sfx/${e.sound}.wav`)} volume={e.volume ?? d.volume} loop={e.sound === "typing"} />
          </Sequence>
        );
      })}
    </>
  );
};
