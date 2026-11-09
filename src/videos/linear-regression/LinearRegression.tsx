import "../../fonts";
import React from "react";
import {
  AbsoluteFill,
  Html5Audio,
  interpolateColors,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../../components/Background";
import { CodeLineState, CodeWindow } from "../../components/CodeWindow";
import { SceneTitle, TitlePart } from "../../components/SceneTitle";
import { Subtitles } from "../../components/Subtitles";
import { TakeawayCard } from "../../components/TakeawayCard";
import { Terminal } from "../../components/Terminal";
import { TikTokSafeArea } from "../../components/TikTokSafeArea";
import { Watermark } from "../../components/Watermark";
import { clampLerp, springIn } from "../../lib/anim";
import { getSegmentWindows, SegmentWindow, TimedVideoProps } from "../../lib/timing";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { FILE_NAME, FIT_CODE, PREDICT_CODE, R2, TERMINAL_COMMAND, TERMINAL_OUTPUT } from "./code";
import { BEST_FIT, INITIAL_GUESS, X, Y, fr, mse } from "./data";
import { InfoCard } from "./InfoCard";
import { A_COLOR, B_COLOR, ChartState, RegressionChart } from "./RegressionChart";

export const LINEAR_REGRESSION_ID = "linear-regression";
export type LinearRegressionProps = TimedVideoProps;

const SEGMENT_COUNT = 8;
const SAFE_WIDTH = 900;
const CONTENT_TOP = 180;
const CODE_FONT_SIZE = 34;
const CODE_LINE_HEIGHT = 54;

const TITLES: TitlePart[][] = [
  [{ text: "La " }, { text: "régression linéaire", color: COLORS.yellow }],
  [{ text: "1. ", color: COLORS.blue }, { text: "Les données" }],
  [{ text: "2. ", color: COLORS.blue }, { text: "Le modèle" }],
  [{ text: "3. ", color: COLORS.blue }, { text: "L'erreur" }],
  [{ text: "4. ", color: COLORS.blue }, { text: "L'entraînement" }],
  [{ text: "Le code " }, { text: "scikit-learn", color: COLORS.yellow }],
  [{ text: "Prédire " }, { text: "& évaluer", color: COLORS.green }],
  [{ text: "À " }, { text: "retenir", color: COLORS.yellow }],
];

/** Prediction for 75 m² as printed by sklearn (see code.ts). */
const TERMINAL_PREDICTION = parseFloat(TERMINAL_OUTPUT[1].replace(/[[\]]/g, ""));

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const indentOf = (s: string) => s.length - s.trimStart().length;

export const LinearRegression: React.FC<LinearRegressionProps> = ({ showTikTokOverlay, watermark, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (!timing) {
    return <AbsoluteFill style={{ backgroundColor: "black" }} />;
  }

  const seg = getSegmentWindows(timing, durationInFrames, SEGMENT_COUNT);
  const [s1, s2, s3, s4, s5, s6, s7, s8] = seg;
  /** Absolute frame where `word` is spoken in segment `w`. */
  const at = (w: SegmentWindow, word: string, fallback: number, occurrence?: number) =>
    w.start + w.wordFrame(word, fallback, occurrence);
  const sp = (start: number, config?: Parameters<typeof springIn>[1], duration?: number) =>
    springIn(frame - start, config, duration);
  const fadeOutAt = (start: number, length = 15) => clampLerp(frame, [start, start + length], [1, 0]);

  // ---- Phase visibility: chart (1-5) → code (6-7) → outro (8) -------------
  const chartExit = sp(s6.start, { damping: 200 }, 22);
  const codeIn = sp(s6.start + 10, { damping: 18, stiffness: 120 });
  const codeExit = sp(s8.start, { damping: 200 }, 22);
  const outroIn = sp(s8.start + 10, { damping: 18, stiffness: 120 });
  const inChartPhase = frame < s6.start + 22;
  const inCodePhase = frame >= s6.start && frame < s8.start + 22;
  const inOutroPhase = frame >= s8.start;

  // ---- Segments 1-5: the chart ---------------------------------------------
  const fitProgress = sp(at(s5, "trouver", 0.15), { damping: 200 }, 150);
  const current = {
    a: lerp(INITIAL_GUESS.a, BEST_FIT.a, fitProgress),
    b: lerp(INITIAL_GUESS.b, BEST_FIT.b, fitProgress),
  };
  const currentMse = mse(current);
  const fitColor = interpolateColors(fitProgress, [0, 1], [COLORS.yellow, COLORS.green]);

  const teaser = frame < s3.start;
  const chartState: ChartState = {
    axesIn: sp(s1.start + 4, { damping: 200 }, 30),
    xLabelGlow: sp(at(s2, "surface", 0.3), { damping: 200 }, 12) * fadeOutAt(s3.start),
    yLabelGlow: sp(at(s2, "prix", 0.5), { damping: 200 }, 12) * fadeOutAt(s3.start),
    pointsIn: X.map((_, i) => sp(s1.start + 24 + i * 7, { damping: 11, stiffness: 200 })),
    line: teaser
      ? {
          ...BEST_FIT,
          draw: sp(s1.start + 75, { damping: 200 }, 45),
          opacity: fadeOutAt(s2.start, 20),
          color: COLORS.green,
        }
      : {
          ...current,
          draw: sp(at(s3, "droite", 0.15), { damping: 200 }, 40),
          opacity: 1,
          color: fitColor,
        },
    residualsIn: X.map((_, i) => sp(at(s4, "erreur", 0.2) + i * 6, { damping: 200 }, 18)),
    squaresIn: X.map((_, i) => sp(at(s4, "carre", 0.55) + i * 6, { damping: 14, stiffness: 160 })),
    slopeIn: sp(at(s3, "pente", 0.6), { damping: 200 }, 15) * fadeOutAt(s4.start),
    interceptIn: sp(at(s3, "origine", 0.85), { damping: 12, stiffness: 180 }) * fadeOutAt(s4.start),
    chip: { text: "MOINDRES CARRÉS", amount: sp(at(s5, "moindres", 0.75), { damping: 12, stiffness: 200 }) },
    predictionIn: 0,
  };

  const hookIn = sp(s1.start + 40, { damping: 14, stiffness: 160 }) * fadeOutAt(s2.start);
  const dataIn = sp(s2.start + 8, { damping: 16, stiffness: 150 }) * fadeOutAt(s3.start);
  const goalIn = sp(at(s2, "but", 0.6), { damping: 200 }, 15);
  const formulaIn = sp(at(s3, "egale", 0.3), { damping: 15, stiffness: 150 });
  const aGlow = sp(at(s3, "pente", 0.6), { damping: 200 }, 12) * fadeOutAt(s4.start);
  const bGlow = sp(at(s3, "origine", 0.85), { damping: 200 }, 12) * fadeOutAt(s4.start);
  const mseIn = sp(at(s4, "moyenne", 0.7), { damping: 15, stiffness: 150 });
  const mseColor = interpolateColors(fitProgress, [0, 1], [COLORS.red, COLORS.green]);

  // ---- Segments 6-7: the code ----------------------------------------------
  const FAST = 0.55; // frames per character
  const fitStarts: number[] = [];
  let typingCursor = s6.start + 16;
  FIT_CODE.forEach((code, i) => {
    let start = typingCursor;
    if (i === 5) start = Math.max(start, at(s6, "cree", 0.6));
    if (i === 6) start = Math.max(start, at(s6, "entraine", 0.85));
    fitStarts.push(start);
    typingCursor = start + code.trim().length * FAST + 3;
  });
  const printStarts: number[] = [];
  typingCursor = s7.start + 14;
  PREDICT_CODE.forEach((code) => {
    printStarts.push(typingCursor);
    typingCursor = typingCursor + code.length * 0.45 + 3;
  });
  const typedChars = (code: string, start: number, fpc: number) => {
    const indent = indentOf(code);
    const n = code.length - indent;
    const c = Math.floor(clampLerp(frame, [start, start + n * fpc], [0, n]));
    return c > 0 ? indent + c : 0;
  };

  const collapse7 = sp(s7.start, { damping: 200 }, 30);
  const modelGlow = sp(fitStarts[5], { damping: 200 }, 12) * fadeOutAt(at(s6, "fit", 0.95));
  const fitGlow = sp(at(s6, "fit", 0.95), { damping: 200 }, 12) * fadeOutAt(s7.start + 10);
  const fitBadge = sp(at(s6, "fit", 0.95), { damping: 12, stiffness: 200 }) * fadeOutAt(s7.start + 10);

  const lastTyping = (starts: number[], codes: string[], fpc: number) => {
    let idx = -1;
    starts.forEach((st, i) => {
      if (frame >= st) idx = i;
    });
    const busy = idx >= 0 && typedChars(codes[idx], starts[idx], fpc) < codes[idx].length;
    return { idx, busy };
  };
  const fitTyping = lastTyping(fitStarts, FIT_CODE, FAST);
  const printTyping = lastTyping(printStarts, PREDICT_CODE, 0.45);
  const inSeg6 = frame < s7.start;

  const codeLines: CodeLineState[] = FIT_CODE.map((code, i) => {
    const collapses = i < 5;
    return {
      key: `fit-${i}`,
      code,
      lineNumber: i + 1,
      visibleChars: typedChars(code, fitStarts[i], FAST),
      height: (i === 0 ? 1 : sp(fitStarts[i], { damping: 200 }, 8)) * (collapses ? 1 - collapse7 : 1),
      opacity: collapses ? 1 - Math.min(1, collapse7 * 1.6) : 1,
      highlight:
        i === 5
          ? { amount: modelGlow, color: COLORS.blue }
          : i === 6
            ? { amount: fitGlow, color: COLORS.green }
            : undefined,
      badge:
        i === 5
          ? { text: "MODÈLE", color: COLORS.blue, amount: modelGlow }
          : i === 6
            ? { text: "ENTRAÎNEMENT", color: COLORS.green, amount: fitBadge }
            : undefined,
      showCursor: inSeg6 && fitTyping.idx === i,
      cursorBlink: !fitTyping.busy,
    };
  });
  if (frame >= s7.start) {
    PREDICT_CODE.forEach((code, i) => {
      codeLines.push({
        key: `print-${i}`,
        code,
        lineNumber: FIT_CODE.length + i + 1,
        visibleChars: typedChars(code, printStarts[i], 0.45),
        height: sp(printStarts[i], { damping: 200 }, 8),
        showCursor: printTyping.idx === i && (printTyping.busy || i < PREDICT_CODE.length - 1 || frame < terminalAt()),
        cursorBlink: !printTyping.busy,
      });
    });
  }
  function terminalAt() {
    return printStarts[printStarts.length - 1] + PREDICT_CODE[PREDICT_CODE.length - 1].length * 0.45 + 6;
  }
  const terminalStart = terminalAt();
  const terminalIn = sp(terminalStart, { damping: 16, stiffness: 140 });
  const commandChars = Math.floor(
    clampLerp(frame, [terminalStart + 6, terminalStart + 6 + TERMINAL_COMMAND.length * 0.8], [0, TERMINAL_COMMAND.length]),
  );
  const commandDone = terminalStart + 6 + TERMINAL_COMMAND.length * 0.8;
  const outputAt = [commandDone + 8, commandDone + 16, Math.max(commandDone + 24, at(s7, "score", 0.5))];
  const outputIn = outputAt.map((o) => Math.min(1, sp(o, { damping: 12, stiffness: 180 })));
  const resultsIn = sp(outputAt[0] + 6, { damping: 15, stiffness: 150 });
  const r2Bar = sp(Math.max(outputAt[2], at(s7, "proche", 0.75)), { damping: 200 }, 40);
  const codeShift = 110 * (1 - sp(s7.start, { damping: 200 }, 30));

  // ---- Segment 8: outro ----------------------------------------------------
  const outroChart: ChartState = {
    axesIn: 1,
    xLabelGlow: 0,
    yLabelGlow: 0,
    pointsIn: X.map(() => 1),
    line: { ...BEST_FIT, draw: 1, opacity: 1, color: COLORS.green },
    residualsIn: [],
    squaresIn: [],
    slopeIn: 0,
    interceptIn: 0,
    chip: null,
    predictionIn: sp(s8.start + 24, { damping: 12, stiffness: 160 }),
  };

  const monoBig: React.CSSProperties = { fontFamily: FONT_CODE, fontWeight: 700, fontSize: 60, color: "white" };
  const glowSpan = (glow: number, color: string): React.CSSProperties => ({
    color,
    padding: "0 6px",
    borderRadius: 10,
    backgroundColor: `rgba(255,255,255,${0.14 * glow})`,
    boxShadow: glow > 0 ? `0 0 ${30 * glow}px ${color}` : undefined,
  });

  return (
    <AbsoluteFill>
      <Background />

      {timing.segments.map((s) => (
        <Sequence key={s.id} name={`Voix ${s.id}`} from={s.startFrame} durationInFrames={s.durationInFrames}>
          <Html5Audio src={staticFile(s.audioFile)} />
        </Sequence>
      ))}

      <TikTokSafeArea showTikTokOverlay={showTikTokOverlay}>
        {/* Headlines */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 170 }}>
          {TITLES.map((parts, i) => (
            <SceneTitle
              key={i}
              parts={parts}
              fontSize={64}
              start={seg[i].start}
              end={seg[i + 1]?.start ?? durationInFrames}
              isLast={i === TITLES.length - 1}
            />
          ))}
        </div>

        {/* ---- Chart phase ---- */}
        {inChartPhase ? (
          <div
            style={{
              position: "absolute",
              top: CONTENT_TOP,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: 1 - chartExit,
              transform: `translateX(${-200 * chartExit}px) scale(${1 - 0.1 * chartExit})`,
            }}
          >
            <RegressionChart state={chartState} width={SAFE_WIDTH} height={600} />

            {hookIn > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 30,
                  opacity: Math.min(1, hookIn * 1.4),
                  transform: `scale(${0.8 + 0.2 * hookIn})`,
                }}
              >
                <div
                  style={{
                    padding: "12px 30px",
                    borderRadius: 18,
                    backgroundColor: COLORS.blue,
                    color: "#06121c",
                    fontFamily: FONT_UI,
                    fontWeight: 900,
                    fontSize: 44,
                    letterSpacing: 2,
                  }}
                >
                  MACHINE LEARNING
                </div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 38, color: "#e6edf3" }}>
                  expliqué en 1 minute
                </div>
              </div>
            ) : null}

            {dataIn > 0 ? (
              <InfoCard
                label="LES DONNÉES"
                color={COLORS.blue}
                style={{ opacity: Math.min(1, dataIn * 1.4), transform: `translateY(${(1 - dataIn) * 60}px)` }}
              >
                {[
                  { name: "X", desc: "surface", values: X, glow: chartState.xLabelGlow },
                  { name: "y", desc: "prix", values: Y, glow: chartState.yLabelGlow },
                ].map((row) => (
                  <div
                    key={row.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: 58,
                      borderRadius: 12,
                      backgroundColor: `rgba(255, 230, 0, ${0.12 * row.glow})`,
                    }}
                  >
                    <div style={{ width: 210, fontFamily: FONT_UI, fontWeight: 800, fontSize: 32, color: row.glow > 0.01 ? COLORS.yellow : "#c9d1d9" }}>
                      <span style={{ fontFamily: FONT_CODE, color: COLORS.variable }}>{row.name}</span> {row.desc}
                    </div>
                    {row.values.map((v, i) => (
                      <div key={i} style={{ width: 90, textAlign: "right", fontFamily: FONT_CODE, fontSize: 34, color: COLORS.number }}>
                        {v}
                      </div>
                    ))}
                  </div>
                ))}
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: FONT_UI,
                    fontWeight: 800,
                    fontSize: 32,
                    color: "white",
                    opacity: goalIn,
                    transform: `translateY(${(1 - goalIn) * 20}px)`,
                  }}
                >
                  Objectif : prédire <span style={{ color: COLORS.yellow }}>y</span> à partir de{" "}
                  <span style={{ color: COLORS.yellow }}>X</span>
                </div>
              </InfoCard>
            ) : null}

            {formulaIn > 0 ? (
              <InfoCard
                label="LE MODÈLE"
                color={COLORS.yellow}
                style={{ opacity: Math.min(1, formulaIn * 1.4), transform: `translateY(${(1 - formulaIn) * 60}px)` }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div style={monoBig}>
                    y = <span style={glowSpan(aGlow, A_COLOR)}>a</span>·x + <span style={glowSpan(bGlow, B_COLOR)}>b</span>
                  </div>
                  <div style={{ fontFamily: FONT_CODE, fontSize: 34, color: "#c9d1d9", textAlign: "right", lineHeight: 1.35 }}>
                    <div>
                      <span style={{ color: A_COLOR }}>a</span> = {fr(current.a, 2)}
                    </div>
                    <div>
                      <span style={{ color: B_COLOR }}>b</span> = {fr(current.b, 1)}
                    </div>
                  </div>
                </div>
              </InfoCard>
            ) : null}

            {mseIn > 0 ? (
              <InfoCard
                label="L'ERREUR (MSE)"
                color={COLORS.red}
                style={{ opacity: Math.min(1, mseIn * 1.4), transform: `translateY(${(1 - mseIn) * 60}px)` }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: FONT_CODE, fontSize: 36, color: "#e6edf3" }}>
                    MSE = <span style={{ color: COLORS.gutter }}>1/n ·</span> Σ(y − ŷ)²
                  </div>
                  <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 56, color: mseColor }}>{fr(currentMse, 0)}</div>
                </div>
              </InfoCard>
            ) : null}
          </div>
        ) : null}

        {/* ---- Code phase ---- */}
        {inCodePhase ? (
          <div
            style={{
              position: "absolute",
              top: CONTENT_TOP,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              gap: 24,
              opacity: Math.min(1, codeIn * 1.4) * (1 - codeExit),
              transform: `translateY(${codeShift + (1 - codeIn) * 120}px) translateX(${-200 * codeExit}px)`,
            }}
          >
            <CodeWindow
              lines={codeLines}
              fileName={FILE_NAME}
              statusText="Python 3.12   scikit-learn 1.9"
              fontSize={CODE_FONT_SIZE}
              lineHeight={CODE_LINE_HEIGHT}
            />
            {frame >= terminalStart ? (
              <Terminal
                command={TERMINAL_COMMAND}
                commandChars={commandChars}
                fontSize={30}
                output={TERMINAL_OUTPUT.map((text, i) => ({
                  text,
                  amount: outputIn[i],
                  color: i === 1 ? COLORS.yellow : COLORS.green,
                }))}
                style={{ opacity: Math.min(1, terminalIn * 1.5), transform: `translateY(${(1 - terminalIn) * 100}px)` }}
              />
            ) : null}
            {resultsIn > 0 ? (
              <InfoCard
                label="CE QUE ÇA VEUT DIRE"
                color={COLORS.green}
                style={{ opacity: Math.min(1, resultsIn * 1.4), transform: `translateY(${(1 - resultsIn) * 60}px)` }}
              >
                <div style={{ fontFamily: FONT_CODE, fontSize: 32, color: "#e6edf3", lineHeight: 1.45 }}>
                  <span style={{ color: A_COLOR }}>a</span> = {fr(BEST_FIT.a, 2)}{"   "}
                  <span style={{ color: B_COLOR }}>b</span> = {fr(BEST_FIT.b, 2)}{"   "}
                  <span style={{ color: COLORS.yellow }}>75 m² → {fr(TERMINAL_PREDICTION, 0)} k€</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
                  <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 36, color: COLORS.green, whiteSpace: "nowrap" }}>
                    R² = {fr(R2, 2)}
                  </div>
                  <div style={{ flex: 1, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{ width: `${R2 * 100 * r2Bar}%`, height: "100%", borderRadius: 13, backgroundColor: COLORS.green }} />
                  </div>
                  <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 26, color: "#c9d1d9" }}>1 = parfait</div>
                </div>
              </InfoCard>
            ) : null}
          </div>
        ) : null}

        {/* ---- Outro ---- */}
        {inOutroPhase ? (
          <div
            style={{
              position: "absolute",
              top: CONTENT_TOP,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              opacity: Math.min(1, outroIn * 1.4),
              transform: `translateY(${(1 - outroIn) * 120}px)`,
            }}
          >
            <RegressionChart state={outroChart} width={SAFE_WIDTH} height={520} />
            <div style={{ height: 6 }} />
            <TakeawayCard at={at(s8, "simple", 0.2)} color={COLORS.blue} label="SIMPLE" detail="Un fit() et le modèle est entraîné" />
            <TakeawayCard
              at={at(s8, "interpreter", 0.4)}
              color={A_COLOR}
              label="LISIBLE"
              detail={`a = ${fr(BEST_FIT.a, 1)} : +${fr(BEST_FIT.a, 1)} k€ par m² en plus`}
            />
            <TakeawayCard
              at={at(s8, "lineaire", 0.6)}
              color={COLORS.red}
              label="LIMITE"
              detail="Relation courbe ? Il faut un autre modèle"
            />
          </div>
        ) : null}

        <Watermark text={watermark} />
        <Subtitles timing={timing} />
      </TikTokSafeArea>
    </AbsoluteFill>
  );
};
