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
import { SceneTitle, TitlePart } from "../../components/SceneTitle";
import { Subtitles } from "../../components/Subtitles";
import { TikTokSafeArea } from "../../components/TikTokSafeArea";
import { Watermark } from "../../components/Watermark";
import { clampLerp, springIn } from "../../lib/anim";
import { getSegmentWindows, SegmentWindow, TimedVideoProps } from "../../lib/timing";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { X, Y, fr } from "../linear-regression/data";
import { InfoCard } from "../../components/InfoCard";
import { A_COLOR, B_COLOR, ChartState, RegressionChart } from "../linear-regression/RegressionChart";
import { B, BAD_PATH, BEST_A, GOOD_PATH, GUESS_A, cost } from "./descent";
import { Valley, ValleyState } from "./Valley";

export const GRADIENT_DESCENT_ID = "gradient-descent";
export type GradientDescentProps = TimedVideoProps;

const SEGMENT_COUNT = 8;
const W = 900; // safe-area width
const TOP = 180; // content starts below the headline
/** Apartment used as the worked example in segment 3 (70 m²). */
const FOCUS = 3;

const TITLES: TitlePart[][] = [
  [{ text: "Une machine qui " }, { text: "apprend", color: COLORS.yellow }, { text: " ?" }],
  [{ text: "La formule, " }, { text: "en vrai", color: COLORS.yellow }],
  [{ text: "Deviner, puis " }, { text: "comparer", color: COLORS.blue }],
  [{ text: "Le score " }, { text: "d'erreur", color: COLORS.red }],
  [{ text: "Perdu dans le " }, { text: "brouillard", color: COLORS.blue }],
  [{ text: "Un pas " }, { text: "à la fois", color: COLORS.green }],
  [{ text: "Attention au " }, { text: "piège", color: COLORS.red }],
  [{ text: "Ton " }, { text: "défi", color: COLORS.yellow }],
];

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Colour of the error score: green when low, red when high (log scale). */
const scoreColor = (c: number) =>
  interpolateColors(Math.log10(Math.max(c, 1)), [2.6, 3.6, 4.4], [COLORS.green, COLORS.yellow, COLORS.red]);

const emptyChart = (): ChartState => ({
  axesIn: 1,
  xLabelGlow: 0,
  yLabelGlow: 0,
  pointsIn: X.map(() => 1),
  line: null,
  residualsIn: [],
  squaresIn: [],
  slopeIn: 0,
  interceptIn: 0,
  chip: null,
  predictionIn: 0,
});

export const GradientDescent: React.FC<GradientDescentProps> = ({ showTikTokOverlay, watermark, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (!timing) {
    return <AbsoluteFill style={{ backgroundColor: "black" }} />;
  }

  const seg = getSegmentWindows(timing, durationInFrames, SEGMENT_COUNT);
  const [s1, s2, s3, s4, s5, s6, s7, s8] = seg;
  const at = (w: SegmentWindow, word: string, fallback: number, occurrence?: number) =>
    w.start + w.wordFrame(word, fallback, occurrence);
  const sp = (start: number, config?: Parameters<typeof springIn>[1], duration?: number) =>
    springIn(frame - start, config, duration);
  const pop = (start: number) => sp(start, { damping: 13, stiffness: 170 });
  const ease = (start: number, duration = 15) => sp(start, { damping: 200 }, duration);

  /** Scene container: springs in at `start`, cross-fades out after `end`. */
  const scene = (start: number, end: number) => {
    const enter = sp(start, { damping: 18, stiffness: 120 });
    const exit = clampLerp(frame, [end, end + 14], [0, 1]);
    return {
      visible: frame >= start && frame < end + 14,
      style: {
        position: "absolute" as const,
        top: TOP,
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

  /** Moves the hiker along `path`; step k starts at `starts[k]`. */
  const followPath = (path: number[], starts: number[], duration: number, hop: number) => {
    let a = path[0];
    let lift = 0;
    let walk = 0;
    let facing: 1 | -1 = path[1] >= path[0] ? 1 : -1;
    let done = 0;
    starts.forEach((start, k) => {
      if (frame < start) return;
      const p = Math.min(1, ease(start, duration));
      a = lerp(path[k], path[k + 1], p);
      facing = path[k + 1] >= path[k] ? 1 : -1;
      lift = hop * Math.sin(Math.PI * p);
      walk = p < 0.98 ? p * Math.PI * 4 : 0;
      if (p > 0.98) done = k + 1;
    });
    return { a, lift, walk, facing, done };
  };

  // ======================= Scene A — hook (segment 1) =======================
  const sceneA = scene(s1.start, s2.start);
  const correct = ease(at(s1, "corrige", 0.75), 40);
  const hookA = lerp(GUESS_A, BEST_A, correct);
  const hookChart: ChartState = {
    ...emptyChart(),
    pointsIn: X.map((_, i) => pop(s1.start + 4 + i * 5)),
    line: {
      a: hookA,
      b: B,
      draw: ease(s1.start + 20, 30),
      opacity: 1,
      color: scoreColor(cost(hookA)),
    },
  };
  const wrongStamp = sp(at(s1, "trompe", 0.6), { damping: 10, stiffness: 160 }) * (1 - ease(at(s1, "corrige", 0.75)));
  const seriesPill = pop(s1.start + 30);

  // ===================== Scene B — formula in words (2) =====================
  const sceneB = scene(s2.start, s3.start);
  const formulaRows = [
    { word: "PRIX", example: "le prix de l'appart", symbol: "y", color: "white", op: "", at: at(s2, "prix", 0.05) },
    { word: "PRIX AU M²", example: "ex. 3 300 € / m²", symbol: "a", color: A_COLOR, op: "=", at: at(s2, "metre", 0.3) },
    { word: "SURFACE", example: "ex. 70 m²", symbol: "x", color: COLORS.blue, op: "×", at: at(s2, "surface", 0.4) },
    { word: "PRIX DE DÉPART", example: "ex. 43 000 €", symbol: "b", color: B_COLOR, op: "+", at: at(s2, "depart", 0.5) },
  ];
  const symbolsAt = at(s2, "formule", 0.8);
  const finalFormula = pop(at(s2, "egale", 0.85));

  // ============== Scene C — guess vs reality + error score (3-4) =============
  const sceneC = scene(s3.start, s5.start);
  const guessAt = at(s3, "devine", 0.35);
  const realAt = at(s3, "vrai", 0.6);
  const wrongAt = at(s3, "trompee", 0.85);
  const allErrorsAt = at(s4, "apparts", 0.1);
  const squaresAt = at(s4, "score", 0.18);
  const guessY = GUESS_A * X[FOCUS] + B;
  const errorChart: ChartState = {
    ...emptyChart(),
    line: { a: GUESS_A, b: B, draw: ease(guessAt, 30), opacity: 1, color: COLORS.yellow },
    focus: { index: FOCUS, ringIn: ease(realAt) * (1 - ease(allErrorsAt)), predictedIn: pop(guessAt + 12) * (1 - ease(allErrorsAt)) },
    residualsIn: X.map((_, i) => (i === FOCUS ? ease(wrongAt, 18) : ease(allErrorsAt + i * 5, 18))),
    squaresIn: X.map((_, i) => sp(squaresAt + i * 6, { damping: 14, stiffness: 160 })),
  };
  const exampleCard = pop(guessAt) * (1 - ease(s4.start));
  const exampleRows = [
    { label: "Deviné", value: `${fr(guessY, 0)} k€`, color: COLORS.yellow, in: pop(guessAt + 8) },
    { label: "Vrai prix", value: `${fr(Y[FOCUS], 0)} k€`, color: COLORS.blue, in: pop(realAt) },
    { label: "Erreur", value: `${fr(Y[FOCUS] - guessY, 0)} k€`, color: COLORS.red, in: pop(wrongAt) },
  ];
  const scoreCard = pop(squaresAt);
  const scoreValue = cost(GUESS_A) * clampLerp(frame, [squaresAt, squaresAt + 60], [0, 1]);
  const lowerIsBetter = pop(at(s4, "bas", 0.3));
  const tipCard = pop(at(s4, "astuce", 0.4));
  const tips = [
    { error: 2, costValue: 4, in: pop(at(s4, "2", 0.7)) },
    { error: 10, costValue: 100, in: pop(at(s4, "10", 0.88)) },
  ];

  // =================== Scene D — the foggy valley (5-7) ======================
  const sceneD = scene(s5.start, s8.start);
  const hikerAppears = pop(at(s5, "randonneur", 0.35));
  const fogIn = ease(at(s5, "brouillard", 0.45), 30);
  const fogLift = ease(at(s6, "descente", 0.85), 25);
  const slopeIn = ease(at(s5, "pente", 0.85));

  const stepStarts: number[] = [
    at(s6, "pas", 0.1) - 8,
    at(s6, "autre", 0.25) - 8,
    at(s6, "autre", 0.4, 2) - 8,
  ];
  while (stepStarts.length < GOOD_PATH.length - 1) stepStarts.push(stepStarts[stepStarts.length - 1] + 26);
  const good = followPath(GOOD_PATH, stepStarts, 22, 0);

  const badStart = at(s7, "grands", 0.2);
  const bad = followPath(BAD_PATH, BAD_PATH.slice(1).map((_, k) => badStart + k * 28), 24, 150);
  const inBadPart = frame >= s7.start + 12;
  const swapOut = clampLerp(frame, [s7.start, s7.start + 12], [1, 0]);
  const swapIn = ease(s7.start + 12, 12);
  const flyOff = clampLerp(frame, [badStart + (BAD_PATH.length - 1) * 28, badStart + (BAD_PATH.length - 1) * 28 + 20], [1, 0]);
  const hiker = inBadPart
    ? { a: bad.a, lift: bad.lift, walk: bad.walk, facing: bad.facing, opacity: swapIn * flyOff, tint: "#ffd1d6" }
    : { a: good.a, lift: 0, walk: good.walk, facing: good.facing, opacity: hikerAppears * (frame < s7.start ? 1 : swapOut) };

  const valleyState: ValleyState = {
    curveIn: ease(at(s5, "trouver", 0.1), 40),
    bestIn: ease(at(s5, "bas", 0.25)),
    hiker: hikerAppears > 0 ? hiker : null,
    fog: fogIn * (1 - fogLift),
    slope: inBadPart ? null : { amount: slopeIn * (1 - fogLift), direction: "downhill", label: "ça descend" },
    trail: inBadPart ? [] : GOOD_PATH.slice(0, good.done).map((a) => ({ a, amount: 1 })),
    score: { amount: hikerAppears, color: scoreColor(cost(hiker.a)) },
    chip: inBadPart
      ? { text: "QUELLE TAILLE DE PAS ?", amount: pop(at(s7, "choisir", 0.6)), color: COLORS.red }
      : { text: "DESCENTE DE GRADIENT", amount: pop(at(s6, "descente", 0.85)), color: COLORS.green },
    stamp: { text: "À SUIVRE", amount: sp(at(s7, "reponse", 0.8), { damping: 11, stiffness: 140 }), color: COLORS.yellow },
  };
  const miniChart: ChartState = {
    ...emptyChart(),
    line: {
      a: hikerAppears > 0 ? hiker.a : GUESS_A,
      b: B,
      draw: 1,
      opacity: inBadPart ? Math.max(0.25, hiker.opacity) : 1,
      color: scoreColor(cost(hikerAppears > 0 ? hiker.a : GUESS_A)),
    },
  };

  // ========================== Scene E — quiz (8) =============================
  const sceneE = scene(s8.start, durationInFrames + 100);
  const QUIZ_A = 4.9; // right wall of the valley: the ground rises to the right
  const quizValley: ValleyState = {
    curveIn: 1,
    bestIn: 0,
    hiker: { a: QUIZ_A, lift: 0, walk: 0, facing: 1, opacity: 1 },
    fog: 1,
    slope: { amount: ease(at(s8, "monte", 0.25)), direction: "uphill", label: "ça monte" },
    trail: [],
    score: null,
    chip: { text: "TU VAS OÙ ?", amount: pop(at(s8, "fais", 0.45)), color: COLORS.yellow },
    stamp: null,
  };
  const options = [
    { letter: "A", text: "À GAUCHE", arrow: "←", color: COLORS.blue, in: pop(at(s8, "gauche", 0.5)) },
    { letter: "B", text: "À DROITE", arrow: "→", color: A_COLOR, in: pop(at(s8, "droite", 0.55, 2)) },
  ];
  const commentPill = pop(at(s8, "commentaire", 0.72));
  const subscribePill = pop(at(s8, "abonnetoi", 0.82));

  // ============================== Render =====================================
  const pill = (text: string, color: string, amount: number, textColor = "#0b0b0b") => (
    <div
      style={{
        alignSelf: "center",
        padding: "12px 30px",
        borderRadius: 18,
        backgroundColor: color,
        color: textColor,
        fontFamily: FONT_UI,
        fontWeight: 900,
        fontSize: 34,
        letterSpacing: 1,
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.7 + 0.3 * amount})`,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill>
      <Background />

      {timing.segments.map((s) => (
        <Sequence key={s.id} name={`Voix ${s.id}`} from={s.startFrame} durationInFrames={s.durationInFrames}>
          <Html5Audio src={staticFile(s.audioFile)} />
        </Sequence>
      ))}

      <TikTokSafeArea showTikTokOverlay={showTikTokOverlay}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 170 }}>
          {TITLES.map((parts, i) => (
            <SceneTitle
              key={i}
              parts={parts}
              fontSize={60}
              start={seg[i].start}
              end={seg[i + 1]?.start ?? durationInFrames}
              isLast={i === TITLES.length - 1}
            />
          ))}
        </div>

        {/* ---------------- A: hook ---------------- */}
        {sceneA.visible ? (
          <div style={sceneA.style}>
            <div style={{ position: "relative" }}>
              <RegressionChart state={hookChart} width={W} height={620} />
              {wrongStamp > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "42%",
                    padding: "6px 36px",
                    border: `10px solid ${COLORS.red}`,
                    borderRadius: 20,
                    color: COLORS.red,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    fontFamily: FONT_UI,
                    fontWeight: 900,
                    fontSize: 120,
                    letterSpacing: 6,
                    opacity: Math.min(1, wrongStamp),
                    transform: `translate(-50%, -50%) rotate(-10deg) scale(${2 - Math.min(1, wrongStamp)})`,
                  }}
                >
                  FAUX
                </div>
              ) : null}
            </div>
            <div style={{ height: 20 }} />
            {pill("RÉGRESSION LINÉAIRE · PARTIE 2", COLORS.blue, seriesPill)}
          </div>
        ) : null}

        {/* ---------------- B: formula in plain words ---------------- */}
        {sceneB.visible ? (
          <div style={{ ...sceneB.style, gap: 18, paddingTop: 110 }}>
            {formulaRows.map((row, i) => {
              const rowIn = pop(row.at);
              const symbolIn = pop(symbolsAt + i * 7);
              return (
                <div
                  key={row.word}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 130,
                    opacity: Math.min(1, rowIn * 1.4),
                    transform: `translateX(${(1 - rowIn) * -120}px)`,
                  }}
                >
                  <div style={{ width: 70, fontFamily: FONT_CODE, fontWeight: 700, fontSize: 64, color: "#8b949e" }}>{row.op}</div>
                  <div
                    style={{
                      flex: 1,
                      padding: "14px 26px",
                      borderRadius: 20,
                      backgroundColor: "rgba(13,17,23,0.85)",
                      border: `3px solid ${row.color}`,
                    }}
                  >
                    <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 46, color: row.color }}>{row.word}</div>
                    <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 28, color: "#9aa4b2" }}>{row.example}</div>
                  </div>
                  <div
                    style={{
                      width: 150,
                      textAlign: "center",
                      fontFamily: FONT_CODE,
                      fontWeight: 700,
                      fontSize: 90,
                      color: row.color,
                      opacity: Math.min(1, symbolIn),
                      transform: `scale(${0.4 + 0.6 * symbolIn})`,
                      textShadow: `0 0 ${30 * Math.min(1, symbolIn)}px ${row.color}`,
                    }}
                  >
                    {row.symbol}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                alignSelf: "center",
                marginTop: 18,
                padding: "16px 44px",
                borderRadius: 24,
                backgroundColor: "rgba(255,230,0,0.1)",
                border: `3px solid ${COLORS.yellow}`,
                fontFamily: FONT_CODE,
                fontWeight: 700,
                fontSize: 76,
                color: "white",
                opacity: Math.min(1, finalFormula * 1.4),
                transform: `scale(${0.6 + 0.4 * finalFormula})`,
              }}
            >
              y = <span style={{ color: A_COLOR }}>a</span>·<span style={{ color: COLORS.blue }}>x</span> +{" "}
              <span style={{ color: B_COLOR }}>b</span>
            </div>
          </div>
        ) : null}

        {/* ---------------- C: guess vs reality + error score ---------------- */}
        {sceneC.visible ? (
          <div style={sceneC.style}>
            <RegressionChart state={errorChart} width={W} height={560} />

            {exampleCard > 0 ? (
              <InfoCard label="EXEMPLE : UN APPART DE 70 m²" color={COLORS.yellow} style={{ opacity: Math.min(1, exampleCard * 1.4) }}>
                {exampleRows.map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      height: 58,
                      opacity: Math.min(1, row.in * 1.4),
                      transform: `translateX(${(1 - row.in) * 60}px)`,
                    }}
                  >
                    <span style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 38, color: "#e6edf3" }}>{row.label}</span>
                    <span style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 46, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </InfoCard>
            ) : null}

            {scoreCard > 0 && frame >= s4.start ? (
              <InfoCard label="SCORE D'ERREUR" color={COLORS.red} style={{ opacity: Math.min(1, scoreCard * 1.4) }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 26, color: "#9aa4b2" }}>
                      les pros disent : « fonction de coût »
                    </div>
                    <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 30, color: COLORS.green, opacity: lowerIsBetter }}>
                      ↓ plus c'est bas, mieux c'est
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 64, color: COLORS.red }}>{fr(scoreValue, 0)}</div>
                </div>
              </InfoCard>
            ) : null}

            {tipCard > 0 ? (
              <InfoCard
                label="LES GROSSES ERREURS COMPTENT PLUS"
                color={COLORS.yellow}
                style={{ opacity: Math.min(1, tipCard * 1.4), transform: `translateY(${(1 - tipCard) * 40}px)` }}
              >
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: 170 }}>
                  {tips.map((tip) => (
                    <div
                      key={tip.error}
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 22,
                        opacity: Math.min(1, tip.in * 1.4),
                        transform: `scale(${0.6 + 0.4 * Math.min(1, tip.in)})`,
                        transformOrigin: "50% 100%",
                      }}
                    >
                      <div
                        style={{
                          width: tip.error * 13,
                          height: tip.error * 13,
                          backgroundColor: "rgba(255,77,94,0.25)",
                          border: `3px solid ${COLORS.red}`,
                        }}
                      />
                      <div style={{ fontFamily: FONT_UI, lineHeight: 1.2 }}>
                        <div style={{ fontWeight: 700, fontSize: 28, color: "#c9d1d9" }}>erreur {tip.error}</div>
                        <div style={{ fontWeight: 900, fontSize: 44, color: COLORS.red }}>coûte {tip.costValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            ) : null}
          </div>
        ) : null}

        {/* ---------------- D: valley + gradient descent ---------------- */}
        {sceneD.visible ? (
          <div style={sceneD.style}>
            <RegressionChart state={miniChart} width={W} height={380} />
            <Valley state={valleyState} width={W} height={560} />
          </div>
        ) : null}

        {/* ---------------- E: quiz ---------------- */}
        {sceneE.visible ? (
          <div style={sceneE.style}>
            <Valley state={quizValley} width={W} height={520} />
            <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
              {options.map((o) => {
                const pulse = o.in >= 1 ? 1 + 0.025 * Math.sin((frame - s8.start) / 7 + (o.letter === "B" ? Math.PI : 0)) : 1;
                return (
                  <div
                    key={o.letter}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      padding: "22px 24px",
                      borderRadius: 26,
                      backgroundColor: "rgba(13,17,23,0.88)",
                      border: `5px solid ${o.color}`,
                      boxShadow: `0 0 ${36 * Math.min(1, o.in)}px ${o.color}55`,
                      opacity: Math.min(1, o.in * 1.4),
                      transform: `scale(${(0.6 + 0.4 * Math.min(1, o.in)) * pulse})`,
                    }}
                  >
                    <div
                      style={{
                        width: 86,
                        height: 86,
                        borderRadius: 43,
                        backgroundColor: o.color,
                        color: "#0b0b0b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: FONT_UI,
                        fontWeight: 900,
                        fontSize: 56,
                        flexShrink: 0,
                      }}
                    >
                      {o.letter}
                    </div>
                    <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 40, color: "white", lineHeight: 1.1 }}>
                      <div style={{ fontSize: 52, color: o.color }}>{o.arrow}</div>
                      {o.text}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 6 }} />
            {pill("ÉCRIS A OU B EN COMMENTAIRE", COLORS.yellow, commentPill)}
            {pill("ABONNE-TOI POUR LA RÉPONSE", COLORS.red, subscribePill, "white")}
          </div>
        ) : null}

        <Watermark text={watermark} />
        <Subtitles timing={timing} />
      </TikTokSafeArea>
    </AbsoluteFill>
  );
};
