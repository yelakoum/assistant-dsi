import "../../fonts";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeRun, CodeRunLine, commandDoneAt, scheduleTyping } from "../../components/CodeRun";
import { EpisodeShell, Pill, SeriesBadge } from "../../components/Episode";
import { InfoCard } from "../../components/InfoCard";
import { Dot, Plot } from "../../components/Plot";
import { TitlePart } from "../../components/SceneTitle";
import { createCues, SfxTrack } from "../../components/Sfx";
import { TakeawayCard } from "../../components/TakeawayCard";
import { clampLerp } from "../../lib/anim";
import { episodeTools } from "../../lib/episode";
import { TimedVideoProps } from "../../lib/timing";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { fr } from "../linear-regression/data";
import {
  COMMAND,
  FILE_NAME,
  FIT_CODE,
  OUTPUT,
  PASSED,
  Q_REVISION,
  Q_SLEEP,
  Q_SLEEP_LEVEL2,
  ROOT_ENTROPY,
  SPLIT_REVISION,
  SPLIT_SLEEP,
  STUDENTS,
} from "./data";
import { EntropyGauge, EntropyJar } from "./Entropy";
import { TreeDiagram, TreeState } from "./TreeDiagram";

export const DECISION_TREE_ID = "decision-tree";

const W = 900;
const FAIL = COLORS.red;
const PASS = COLORS.green;
const SLEEP_COLOR = "#ff9f43";

const TITLES: TitlePart[][] = [
  [{ text: "Comment l'arbre " }, { text: "choisit ?", color: COLORS.yellow }],
  [{ text: "Les " }, { text: "données", color: COLORS.blue }],
  [{ text: "C'est quoi " }, { text: "l'entropie ?", color: COLORS.yellow }],
  [{ text: "La " }, { text: "formule", color: COLORS.yellow }],
  [{ text: "On teste " }, { text: "la révision", color: COLORS.blue }],
  [{ text: "On teste " }, { text: "le sommeil", color: SLEEP_COLOR }],
  [{ text: "Le " }, { text: "2e niveau", color: PASS }],
  [{ text: "Le code " }, { text: "scikit-learn", color: COLORS.yellow }],
  [{ text: "À " }, { text: "retenir", color: COLORS.yellow }],
];

type Tag = { x: number; y: number; text: string; color: string; amount: number };

type PlotState = {
  pointsIn: number[];
  passGlow: number;
  failGlow: number;
  splitRev: number;
  splitRevDim: number;
  splitSleepRoot: number;
  splitSleep2: number;
  leftZone: number;
  rightZones: number;
  tags: Tag[];
};

const ExamPlot: React.FC<{ s: PlotState; height: number }> = ({ s, height }) => (
  <Plot
    width={W}
    height={height}
    xDomain={[0, 10]}
    yDomain={[3, 9]}
    xTicks={[0, 2, 4, 6, 8, 10]}
    yTicks={[4, 6, 8]}
    xLabel="heures de révision"
    yLabel="h de sommeil"
    children={(sc) => {
      const x4 = sc.sx(SPLIT_REVISION);
      const y5 = sc.sy(SPLIT_SLEEP);
      return (
        <>
          {s.leftZone > 0 ? <rect x={sc.left} y={sc.top} width={x4 - sc.left} height={sc.bottom - sc.top} fill={FAIL} opacity={0.14 * s.leftZone} /> : null}
          {s.rightZones > 0 ? (
            <>
              <rect x={x4} y={sc.top} width={sc.right - x4} height={y5 - sc.top} fill={PASS} opacity={0.16 * s.rightZones} />
              <rect x={x4} y={y5} width={sc.right - x4} height={sc.bottom - y5} fill={FAIL} opacity={0.14 * s.rightZones} />
            </>
          ) : null}
          {s.splitRev > 0 ? (
            <line
              x1={x4}
              x2={x4}
              y1={sc.top}
              y2={sc.top + (sc.bottom - sc.top) * s.splitRev}
              stroke={COLORS.yellow}
              strokeWidth={6}
              strokeDasharray={s.splitRevDim > 0.5 ? "12 10" : undefined}
              opacity={1 - 0.6 * s.splitRevDim}
            />
          ) : null}
          {s.splitSleepRoot > 0 ? (
            <line
              x1={sc.left}
              x2={sc.left + (sc.right - sc.left) * Math.min(1, s.splitSleepRoot)}
              y1={y5}
              y2={y5}
              stroke={SLEEP_COLOR}
              strokeWidth={6}
              opacity={Math.min(1, s.splitSleepRoot)}
            />
          ) : null}
          {s.splitSleep2 > 0 ? (
            <line x1={x4} x2={x4 + (sc.right - x4) * s.splitSleep2} y1={y5} y2={y5} stroke={COLORS.yellow} strokeWidth={6} />
          ) : null}
          {STUDENTS.map(([x, y], i) => {
            const glow = PASSED[i] ? s.passGlow : s.failGlow;
            return (
              <g key={i}>
                {glow > 0 ? (
                  <circle cx={sc.sx(x)} cy={sc.sy(y)} r={28 + 6 * glow} fill="none" stroke={PASSED[i] ? PASS : FAIL} strokeWidth={4} opacity={glow} />
                ) : null}
                <Dot x={sc.sx(x)} y={sc.sy(y)} color={PASSED[i] ? PASS : FAIL} amount={s.pointsIn[i] ?? 0} />
              </g>
            );
          })}
        </>
      );
    }}
    overlay={(sc) => (
      <>
        {s.tags.map((t) =>
          t.amount > 0 ? (
            <div
              key={`${t.text}-${t.x}-${t.y}`}
              style={{
                position: "absolute",
                left: sc.sx(t.x),
                top: sc.sy(t.y),
                transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * Math.min(1, t.amount)})`,
                padding: "6px 14px",
                borderRadius: 12,
                backgroundColor: "rgba(0,0,0,0.78)",
                border: `3px solid ${t.color}`,
                fontFamily: FONT_UI,
                fontWeight: 900,
                fontSize: 24,
                color: "white",
                whiteSpace: "nowrap",
                opacity: Math.min(1, t.amount * 1.4),
              }}
            >
              {t.text}
            </div>
          ) : null,
        )}
      </>
    )}
  />
);

/** "3 ratés · 4 réussis · H = 0,99" */
const groupText = (g: { n: number; passed: number; h: number }) => {
  const failed = g.n - g.passed;
  const parts = [failed ? `${failed} raté${failed > 1 ? "s" : ""}` : "", g.passed ? `${g.passed} réussi${g.passed > 1 ? "s" : ""}` : ""].filter(Boolean);
  return `${parts.join(" · ")} · H = ${fr(g.h, g.h === 0 ? 0 : 2)}`;
};

export const TreeEpisode: React.FC<TimedVideoProps> = ({ showTikTokOverlay, watermark, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!timing) return <AbsoluteFill style={{ backgroundColor: "black" }} />;

  const { seg, at, pop: popRaw, ease, fadeOut, scene } = episodeTools(frame, timing, durationInFrames, 9);
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9] = seg;
  const { events, cue } = createCues();
  /** Pop-in with its pop sound. */
  const pop = (start: number, volume?: number) => popRaw(cue(start, "pop", { volume }));
  // A soft whoosh on every headline change.
  seg.forEach((w, i) => i > 0 && cue(w.start, "whoosh"));

  // ---- Scene A: the class (segments 1-2) -----------------------------------
  const sceneA = scene(s1.start, s3.start);
  const plotA: PlotState = {
    pointsIn: STUDENTS.map((_, i) => popRaw(s1.start + 8 + i * 4)),
    passGlow: ease(cue(at(s2, "reussis", 0.8), "tick")) * fadeOut(at(s2, "rates", 0.9) + 30),
    failGlow: ease(cue(at(s2, "rates", 0.9), "tick")) * fadeOut(s3.start),
    splitRev: 0,
    splitRevDim: 0,
    splitSleepRoot: 0,
    splitSleep2: 0,
    leftZone: 0,
    rightZones: 0,
    tags: [],
  };
  cue(s1.start + 8, "pop", { volume: 0.2 });
  const badgeIn = pop(s1.start + 30) * fadeOut(s2.start);
  const classCard = pop(s2.start + 12);
  const passChip = pop(at(s2, "reussis", 0.8));
  const failChip = pop(at(s2, "rates", 0.9));

  // ---- Scene B: what entropy is + formula (segments 3-4) -------------------
  const sceneB = scene(s3.start, s5.start);
  const pureJar = pop(at(s3, "pur", 0.45) - 30);
  const pureValue = pop(at(s3, "zero", 0.45));
  const chaosJar = pop(at(s3, "cinquantecinquante", 0.7) - 6);
  const chaosValue = pop(at(s3, "chaos", 0.85));
  const gaugeIn = pop(at(s3, "desordre", 0.1));
  const jarsOut = fadeOut(s4.start, 12);
  const formulaIn = pop(at(s4, "formule", 0.05));
  const sumGlow = ease(at(s4, "somme", 0.15)) * fadeOut(at(s4, "classe", 0.4));
  const pRows = [
    { text: "p(réussi) = 4/10 = 0,4", color: PASS, in: pop(at(s4, "quatre", 0.45)) },
    { text: "p(raté)   = 6/10 = 0,6", color: FAIL, in: pop(at(s4, "dix", 0.55)) },
  ];
  const calcIn = pop(at(s4, "entropie", 0.6));
  const resultIn = pop(cue(at(s4, "quatrevingtdixsept", 0.72), "ding"));
  const classJar = pop(at(s4, "classe", 0.4));
  // Gauge needle: 0.5 → 0 (pure) → 1 (chaos) → 0.97 (our class).
  const needle =
    frame < s4.start
      ? 0.5 - 0.5 * ease(at(s3, "zero", 0.45), 20) + ease(at(s3, "cinquantecinquante", 0.7), 25)
      : 1 - (1 - ROOT_ENTROPY) * ease(at(s4, "quatrevingtdixsept", 0.72), 25);
  const gaugeCaption = frame < s4.start ? undefined : "NOTRE CLASSE";

  // ---- Scene C: testing both questions (segments 5-6) ----------------------
  const sceneC = scene(s5.start, s7.start);
  const q1Row = pop(at(s5, "revise", 0.25));
  const q1Line = ease(at(s5, "revise", 0.25), 20);
  const q1LeftTag = pop(at(s5, "rates", 0.55));
  const q1RightTag = pop(at(s5, "moyenne", 0.75) - 30);
  const q1After = pop(at(s5, "moyenne", 0.75));
  const q1Gain = ease(cue(at(s5, "cinquantecinq", 0.9), "tick"), 30);
  const q2Row = pop(at(s6, "dormi", 0.02));
  const q2Line = ease(at(s6, "dormi", 0.02), 20);
  const q2Tags = pop(at(s6, "dormi", 0.02) + 22);
  const q2After = pop(at(s6, "soixanteneuf", 0.4));
  const q2Gain = ease(cue(at(s6, "gain", 0.6), "tick"), 30);
  const winner = pop(cue(at(s6, "revision", 0.9), "ding"));
  const q2Fade = fadeOut(at(s6, "revision", 0.9), 18);
  const plotC: PlotState = {
    pointsIn: STUDENTS.map(() => 1),
    passGlow: 0,
    failGlow: 0,
    splitRev: q1Line,
    splitRevDim: frame >= s6.start ? 1 - ease(at(s6, "revision", 0.9)) : 0,
    splitSleepRoot: q2Line * q2Fade,
    splitSleep2: 0,
    leftZone: 0,
    rightZones: 0,
    tags:
      frame < s6.start
        ? [
            { x: 2, y: 3.38, text: groupText(Q_REVISION.low), color: PASS, amount: q1LeftTag },
            { x: 7, y: 3.38, text: groupText(Q_REVISION.high), color: COLORS.yellow, amount: q1RightTag },
          ]
        : [
            { x: 8.25, y: 3.38, text: groupText(Q_SLEEP.low), color: PASS, amount: q2Tags * q2Fade },
            { x: 5, y: 8.72, text: groupText(Q_SLEEP.high), color: COLORS.yellow, amount: q2Tags * q2Fade },
          ],
  };

  // ---- Scene D: second level, finished tree (segment 7) --------------------
  const sceneD = scene(s7.start, s8.start);
  const mixedTag = pop(at(s7, "melange", 0.2));
  const split2 = ease(at(s7, "dormi", 0.35), 20);
  const pure = pop(at(s7, "purs", 0.65));
  const finished = pop(cue(at(s7, "termine", 0.9), "ding"));
  const plotD: PlotState = {
    pointsIn: STUDENTS.map(() => 1),
    passGlow: 0,
    failGlow: 0,
    splitRev: 1,
    splitRevDim: 0,
    splitSleepRoot: 0,
    splitSleep2: split2,
    leftZone: 1,
    rightZones: ease(at(s7, "purs", 0.65)),
    tags: [
      { x: 2, y: 3.38, text: "H = 0", color: PASS, amount: 1 },
      { x: 7, y: 3.38, text: groupText(Q_REVISION.high), color: COLORS.yellow, amount: mixedTag * fadeOut(at(s7, "purs", 0.65), 10) },
      { x: 8.3, y: 3.38, text: "H = 0", color: PASS, amount: pure },
      { x: 7.2, y: 8.72, text: "H = 0", color: PASS, amount: pure },
    ],
  };
  const treeD: TreeState = {
    root: popRaw(s7.start + 6),
    leftLeaf: popRaw(s7.start + 14),
    rightNode: pop(at(s7, "dormi", 0.35)),
    rightLow: pop(at(s7, "purs", 0.65)),
    rightHigh: popRaw(at(s7, "purs", 0.65) + 6),
    path: 0,
    notes: {
      root: `H = ${fr(ROOT_ENTROPY, 2)}`,
      left: "H = 0",
      right: `H = ${fr(Q_SLEEP_LEVEL2.before, 2)}`,
      rLow: "H = 0",
      rHigh: "H = 0",
    },
    notesIn: 1,
  };

  // ---- Scene E: code (segment 8) ------------------------------------------
  const sceneE = scene(s8.start, s9.start);
  const starts = scheduleTyping(FIT_CODE, s8.start + 10, 0.28, {
    5: at(s8, "decision", 0.15),
    6: at(s8, "criterion", 0.3),
    7: at(s8, "fit", 0.55),
    8: at(s8, "export", 0.62),
  });
  const fpcOf = (i: number) => (i <= 4 ? 0.28 : 0.4);
  const lines: CodeRunLine[] = FIT_CODE.map((code, i) => ({
    code,
    typeAt: starts[i],
    fpc: fpcOf(i),
    collapseAt: i >= 1 && i <= 4 ? starts[8] : undefined,
    highlight:
      i === 6
        ? { from: starts[6] + 10, to: starts[7], color: COLORS.yellow, badge: "ENTROPIE" }
        : i === 7
          ? { from: starts[7], to: starts[8], color: PASS, badge: "FIT" }
          : undefined,
  }));
  cue(starts[6] + 10, "pop"); // "ENTROPIE" badge
  cue(starts[7], "pop"); // "FIT" badge
  // Keyboard sound while typing (merged windows).
  const windows = lines.map((l, i) => [l.typeAt, l.typeAt + (l.code.trim().length) * fpcOf(i)] as const);
  const merged: [number, number][] = [];
  windows.forEach(([a, b]) => {
    const last = merged[merged.length - 1];
    if (last && a - last[1] < 8) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  });
  const terminalAt = starts[10] + FIT_CODE[10].trim().length * 0.4 + 8;
  const done = commandDoneAt(terminalAt, COMMAND);
  merged.push([terminalAt + 6, done]);
  merged.forEach(([a, b]) => cue(a, "typing", { duration: Math.max(6, b - a) }));
  const outStart = Math.max(done + 6, at(s8, "affiche", 0.75));
  const outAt = OUTPUT.map((_, i) => cue(outStart + i * 5, "tick", { volume: 0.16 }));
  cue(outAt[outAt.length - 1] + 8, "ding", { volume: 0.2 });
  const giniNote = pop(at(s8, "exactement", 0.85));

  // ---- Scene F: takeaway (segment 9) ---------------------------------------
  const sceneF = scene(s9.start, durationInFrames + 100);
  const treeF: TreeState = { ...treeD, root: 1, leftLeaf: 1, rightNode: 1, rightLow: 1, rightHigh: 1 };
  const cardAt = [cue(at(s9, "arbre", 0.15), "pop"), cue(at(s9, "baisser", 0.4), "pop"), cue(at(s9, "baisser", 0.4) + 16, "pop")];
  const commentPill = pop(at(s9, "commentaire", 0.75));
  const subscribePill = pop(at(s9, "abonnetoi", 0.6));

  const rowStyle = (amount: number, highlight = 0): React.CSSProperties => ({
    padding: "12px 18px",
    borderRadius: 16,
    border: `3px solid ${highlight > 0 ? COLORS.yellow : "rgba(255,255,255,0.12)"}`,
    boxShadow: highlight > 0 ? `0 0 ${30 * Math.min(1, highlight)}px rgba(255,230,0,0.35)` : undefined,
    opacity: Math.min(1, amount * 1.4),
    transform: `translateX(${(1 - Math.min(1, amount)) * 80}px)`,
  });
  const gainBar = (gain: number, progress: number, color: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
      <div style={{ flex: 1, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${(gain / 0.5) * 100 * progress}%`, height: "100%", borderRadius: 11, backgroundColor: color }} />
      </div>
      <div style={{ width: 170, fontFamily: FONT_UI, fontWeight: 900, fontSize: 30, color, opacity: Math.min(1, progress * 2) }}>
        gain {fr(gain, 2)}
      </div>
    </div>
  );

  return (
    <EpisodeShell
      timing={timing}
      seg={seg}
      titles={TITLES}
      durationInFrames={durationInFrames}
      showTikTokOverlay={showTikTokOverlay}
      watermark={watermark}
    >
      <SfxTrack events={events} />

      {/* ---------------- A: the class ---------------- */}
      {sceneA.visible ? (
        <div style={sceneA.style}>
          <ExamPlot s={plotA} height={600} />
          {badgeIn > 0 ? (
            <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
              <SeriesBadge episode={3} topic="L'ARBRE DE DÉCISION · L'ENTROPIE" amount={badgeIn} />
            </div>
          ) : null}
          {classCard > 0 && frame >= s2.start ? (
            <InfoCard label="NOTRE CLASSE · 10 ÉLÈVES" color={COLORS.blue} style={{ opacity: Math.min(1, classCard * 1.4) }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 30, color: "#c9d1d9", marginBottom: 12 }}>
                <span style={{ fontFamily: FONT_CODE, color: COLORS.variable }}>X</span> = heures de révision et de sommeil
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { text: "4 RÉUSSIS", color: PASS, in: passChip },
                  { text: "6 RATÉS", color: FAIL, in: failChip },
                ].map((c) => (
                  <div
                    key={c.text}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "12px 0",
                      borderRadius: 16,
                      border: `4px solid ${c.color}`,
                      fontFamily: FONT_UI,
                      fontWeight: 900,
                      fontSize: 40,
                      color: c.color,
                      opacity: Math.min(1, c.in * 1.4),
                      transform: `scale(${0.6 + 0.4 * Math.min(1, c.in)})`,
                    }}
                  >
                    {c.text}
                  </div>
                ))}
              </div>
            </InfoCard>
          ) : null}
        </div>
      ) : null}

      {/* ---------------- B: entropy explained ---------------- */}
      {sceneB.visible ? (
        <div style={{ ...sceneB.style, gap: 20 }}>
          {frame < s4.start + 12 ? (
            <div style={{ display: "flex", justifyContent: "space-between", height: 540, opacity: jarsOut }}>
              <EntropyJar passed={6} failed={0} label="TOUS PAREILS" h={0} amount={pureJar} balls={ease(at(s3, "pur", 0.45) - 24, 30)} valueIn={pureValue} width={440} height={540} />
              <EntropyJar passed={3} failed={3} label="MOITIÉ-MOITIÉ" h={1} amount={chaosJar} balls={ease(at(s3, "cinquantecinquante", 0.7), 30)} valueIn={chaosValue} width={440} height={540} />
            </div>
          ) : (
            <InfoCard label="ENTROPIE DE SHANNON" color={COLORS.yellow} style={{ opacity: Math.min(1, formulaIn * 1.4), transform: `scale(${0.85 + 0.15 * Math.min(1, formulaIn)})` }}>
              <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 64, color: "white", textAlign: "center", padding: "10px 0" }}>
                H = −
                <span
                  style={{
                    color: COLORS.yellow,
                    padding: "0 8px",
                    borderRadius: 10,
                    backgroundColor: `rgba(255,230,0,${0.15 * sumGlow})`,
                  }}
                >
                  Σ
                </span>{" "}
                p · log₂(p)
              </div>
            </InfoCard>
          )}
          {frame >= s4.start ? (
            <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
              <div style={{ width: 300, display: "flex", justifyContent: "center" }}>
                <EntropyJar passed={4} failed={6} label="NOTRE CLASSE" h={null} amount={classJar} balls={ease(at(s4, "classe", 0.4), 40)} valueIn={0} width={300} height={290} />
              </div>
              <InfoCard label="LE CALCUL" color={COLORS.blue} style={{ flex: 1 }}>
                {pRows.map((r) => (
                  <div key={r.text} style={{ fontFamily: FONT_CODE, fontSize: 30, color: r.color, whiteSpace: "pre", height: 46, opacity: Math.min(1, r.in * 1.4), transform: `translateX(${(1 - Math.min(1, r.in)) * 40}px)` }}>
                    {r.text}
                  </div>
                ))}
                <div style={{ fontFamily: FONT_CODE, fontSize: 25, color: "#e6edf3", marginTop: 6, opacity: Math.min(1, calcIn * 1.4) }}>
                  H = −(0,4·log₂0,4 + 0,6·log₂0,6)
                </div>
                <div
                  style={{
                    fontFamily: FONT_CODE,
                    fontWeight: 700,
                    fontSize: 54,
                    color: FAIL,
                    marginTop: 6,
                    opacity: Math.min(1, resultIn * 1.4),
                    transform: `scale(${0.5 + 0.5 * Math.min(1, resultIn)})`,
                    transformOrigin: "0% 50%",
                  }}
                >
                  = {fr(ROOT_ENTROPY, 2)}
                </div>
              </InfoCard>
            </div>
          ) : null}
          <EntropyGauge value={needle} amount={gaugeIn} width={W} caption={gaugeCaption} />
        </div>
      ) : null}

      {/* ---------------- C: testing questions ---------------- */}
      {sceneC.visible ? (
        <div style={sceneC.style}>
          <ExamPlot s={plotC} height={540} />
          <InfoCard label={`GAIN = ENTROPIE AVANT (${fr(ROOT_ENTROPY, 2)}) − APRÈS`} color={COLORS.yellow}>
            <div style={rowStyle(q1Row, winner)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 34, color: COLORS.blue }}>Révisé &gt; 4 h ?</span>
                <span style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 32, color: "white", opacity: Math.min(1, q1After * 1.4) }}>
                  {fr(ROOT_ENTROPY, 2)} → {fr(Q_REVISION.after, 2)}
                </span>
              </div>
              <div style={{ fontFamily: FONT_CODE, fontSize: 22, color: "#9aa4b2", opacity: Math.min(1, q1After * 1.4) }}>
                moyenne : 4/10 × 0 + 6/10 × {fr(Q_REVISION.high.h, 2)} = {fr(Q_REVISION.after, 2)}
              </div>
              {gainBar(Q_REVISION.gain, q1Gain, COLORS.blue)}
            </div>
            <div style={{ height: 12 }} />
            <div style={{ ...rowStyle(q2Row), opacity: Math.min(1, q2Row * 1.4) * (frame >= s6.start ? 1 : 0) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 34, color: SLEEP_COLOR }}>Dormi &gt; 5 h ?</span>
                <span style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 32, color: "white", opacity: Math.min(1, q2After * 1.4) }}>
                  {fr(ROOT_ENTROPY, 2)} → {fr(Q_SLEEP.after, 2)}
                </span>
              </div>
              {gainBar(Q_SLEEP.gain, q2Gain, SLEEP_COLOR)}
            </div>
            {winner > 0 ? (
              <div
                style={{
                  marginTop: 12,
                  textAlign: "center",
                  fontFamily: FONT_UI,
                  fontWeight: 900,
                  fontSize: 36,
                  color: COLORS.yellow,
                  opacity: Math.min(1, winner * 1.4),
                  transform: `scale(${0.6 + 0.4 * Math.min(1, winner)})`,
                }}
              >
                ✓ PLUS GRAND GAIN → QUESTION CHOISIE
              </div>
            ) : null}
          </InfoCard>
        </div>
      ) : null}

      {/* ---------------- D: second level ---------------- */}
      {sceneD.visible ? (
        <div style={sceneD.style}>
          <ExamPlot s={plotD} height={470} />
          <div style={{ transform: `scale(${1 + 0.03 * finished * clampLerp(frame, [at(s7, "termine", 0.9), at(s7, "termine", 0.9) + 20], [1, 0])})` }}>
            <TreeDiagram s={treeD} width={W} height={420} />
          </div>
        </div>
      ) : null}

      {/* ---------------- E: code ---------------- */}
      {sceneE.visible ? (
        <div style={{ ...sceneE.style, gap: 20 }}>
          <CodeRun
            lines={lines}
            fileName={FILE_NAME}
            fontSize={32}
            lineHeight={48}
            terminal={{
              at: terminalAt,
              command: COMMAND,
              outputs: OUTPUT.map((text, i) => ({
                text,
                at: outAt[i],
                color: text.includes("class: 1") ? PASS : text.includes("class: 0") ? FAIL : COLORS.yellow,
              })),
            }}
          />
          <Pill text="Par défaut, sklearn utilise Gini : même idée" color="rgba(255,255,255,0.12)" textColor="#e6edf3" fontSize={26} amount={giniNote} />
        </div>
      ) : null}

      {/* ---------------- F: takeaway ---------------- */}
      {sceneF.visible ? (
        <div style={{ ...sceneF.style, gap: 14 }}>
          <TreeDiagram s={treeF} width={W} height={420} />
          <TakeawayCard at={cardAt[0]} color={COLORS.yellow} label="ENTROPIE" detail="0 = groupe pur · 1 = chaos" />
          <TakeawayCard at={cardAt[1]} color={COLORS.blue} label="GAIN" detail="Entropie avant − après la question" />
          <TakeawayCard at={cardAt[2]} color={PASS} label="CHOIX" detail="La question au plus grand gain" />
          <div style={{ height: 4 }} />
          <Pill text="QUEL ALGO ENSUITE ? COMMENTE" color={COLORS.yellow} amount={commentPill} />
          <Pill text="ABONNE-TOI" color={COLORS.red} textColor="white" amount={subscribePill} />
        </div>
      ) : null}
    </EpisodeShell>
  );
};
