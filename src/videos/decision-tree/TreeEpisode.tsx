import "../../fonts";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeRun, commandDoneAt, scheduleTyping } from "../../components/CodeRun";
import { EpisodeShell, Pill, SeriesBadge } from "../../components/Episode";
import { InfoCard } from "../../components/InfoCard";
import { Dot, Plot } from "../../components/Plot";
import { TitlePart } from "../../components/SceneTitle";
import { TakeawayCard } from "../../components/TakeawayCard";
import { episodeTools } from "../../lib/episode";
import { TimedVideoProps } from "../../lib/timing";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import {
  COMMAND,
  FILE_NAME,
  FIT_CODE,
  NEW_STUDENT,
  OUTPUT,
  PASSED,
  PREDICT_CODE,
  SPLIT_REVISION,
  SPLIT_SLEEP,
  STUDENTS,
} from "./data";
import { TreeDiagram, TreeState } from "./TreeDiagram";

export const DECISION_TREE_ID = "decision-tree";

const W = 900;
const FAIL = COLORS.red;
const PASS = COLORS.green;
const X_DOMAIN: [number, number] = [0, 10];
const Y_DOMAIN: [number, number] = [3, 9];

const TITLES: TitlePart[][] = [
  [{ text: "Le jeu des " }, { text: "questions", color: COLORS.yellow }],
  [{ text: "Les " }, { text: "données", color: COLORS.blue }],
  [{ text: "Question " }, { text: "n°1", color: COLORS.yellow }],
  [{ text: "Question " }, { text: "n°2", color: COLORS.yellow }],
  [{ text: "Le code " }, { text: "scikit-learn", color: COLORS.yellow }],
  [{ text: "Le " }, { text: "verdict", color: COLORS.green }],
  [{ text: "À " }, { text: "retenir", color: COLORS.yellow }],
];

type PlotState = {
  pointsIn: number[];
  split1: number;
  leftZone: number;
  split2: number;
  rightZones: number;
  student: number;
};

const ExamPlot: React.FC<{ s: PlotState; height: number }> = ({ s, height }) => (
  <Plot
    width={W}
    height={height}
    xDomain={X_DOMAIN}
    yDomain={Y_DOMAIN}
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
          {s.split1 > 0 ? (
            <line x1={x4} x2={x4} y1={sc.top} y2={sc.top + (sc.bottom - sc.top) * s.split1} stroke={COLORS.yellow} strokeWidth={6} />
          ) : null}
          {s.split2 > 0 ? (
            <line x1={x4} x2={x4 + (sc.right - x4) * s.split2} y1={y5} y2={y5} stroke={COLORS.yellow} strokeWidth={6} />
          ) : null}
          {STUDENTS.map(([x, y], i) => (
            <Dot key={i} x={sc.sx(x)} y={sc.sy(y)} color={PASSED[i] ? PASS : FAIL} amount={s.pointsIn[i] ?? 0} />
          ))}
          {s.student > 0 ? (
            <g>
              <circle
                cx={sc.sx(NEW_STUDENT[0])}
                cy={sc.sy(NEW_STUDENT[1])}
                r={22 * Math.min(1.2, s.student)}
                fill={COLORS.yellow}
                stroke="black"
                strokeWidth={4}
                style={{ filter: `drop-shadow(0 0 14px ${COLORS.yellow})` }}
              />
            </g>
          ) : null}
        </>
      );
    }}
    overlay={(sc) => (
      <>
        {s.leftZone > 0 ? (
          <div style={{ position: "absolute", left: sc.left + 16, top: sc.bottom - 56, fontFamily: FONT_UI, fontWeight: 900, fontSize: 34, color: FAIL, opacity: s.leftZone }}>
            RATÉ
          </div>
        ) : null}
        {s.rightZones > 0 ? (
          <>
            <div style={{ position: "absolute", right: 44, top: sc.top + 12, fontFamily: FONT_UI, fontWeight: 900, fontSize: 34, color: PASS, opacity: s.rightZones }}>
              RÉUSSI
            </div>
            <div style={{ position: "absolute", right: 44, top: sc.bottom - 56, fontFamily: FONT_UI, fontWeight: 900, fontSize: 34, color: FAIL, opacity: s.rightZones }}>
              RATÉ
            </div>
          </>
        ) : null}
        {s.split1 >= 1 ? (
          <div style={{ position: "absolute", left: sc.sx(SPLIT_REVISION) + 10, top: sc.top + 4, fontFamily: FONT_UI, fontWeight: 900, fontSize: 26, color: COLORS.yellow }}>
            4 h
          </div>
        ) : null}
        {s.split2 >= 1 ? (
          <div style={{ position: "absolute", left: sc.sx(SPLIT_REVISION) + 14, top: sc.sy(SPLIT_SLEEP) - 38, fontFamily: FONT_UI, fontWeight: 900, fontSize: 26, color: COLORS.yellow }}>
            5 h
          </div>
        ) : null}
      </>
    )}
  />
);

export const TreeEpisode: React.FC<TimedVideoProps> = ({ showTikTokOverlay, watermark, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!timing) return <AbsoluteFill style={{ backgroundColor: "black" }} />;

  const { seg, at, pop, ease, fadeOut, scene } = episodeTools(frame, timing, durationInFrames, 7);
  const [s1, s2, s3, s4, s5, s6, s7] = seg;

  // ---- Scene A: plot + tree (segments 1-4) ---------------------------------
  const sceneA = scene(s1.start, s5.start);
  const coupe = at(s4, "coupe", 0.85);
  const flash = frame >= coupe ? 0.5 + 0.5 * Math.cos((frame - coupe) / 4) * fadeOut(coupe + 30, 10) : 0;
  const plotA: PlotState = {
    pointsIn: STUDENTS.map((_, i) => pop(s1.start + 8 + i * 4)),
    split1: ease(at(s3, "quatre", 0.55), 20),
    leftZone: ease(at(s3, "rate", 0.9)),
    split2: ease(at(s4, "cinq", 0.35), 20),
    rightZones: ease(at(s4, "reussi", 0.6)),
    student: 0,
  };
  const tree: TreeState = {
    root: pop(at(s3, "revise", 0.45)),
    leftLeaf: pop(at(s3, "rate", 0.9)),
    rightNode: pop(at(s4, "dormi", 0.25)),
    rightLow: pop(at(s4, "reussi", 0.6) + 6),
    rightHigh: pop(at(s4, "reussi", 0.6)),
    path: 0,
  };
  const badgeIn = pop(s1.start + 30) * fadeOut(s2.start);
  const legendIn = pop(s2.start + 10) * fadeOut(s3.start);
  const treeIn = frame >= s3.start;

  // ---- Scene B: code (segments 5-6) ----------------------------------------
  const sceneB = scene(s5.start, s7.start);
  const fitStarts = scheduleTyping(FIT_CODE, s5.start + 12, 0.45, {
    6: at(s5, "decision", 0.2),
    7: at(s5, "max", 0.4),
    8: at(s5, "fit", 0.9),
  });
  const fitAt = at(s5, "fit", 0.92);
  const printStarts = scheduleTyping(PREDICT_CODE, s6.start + 10, 0.4);
  const terminalAt = printStarts[1] + PREDICT_CODE[1].length * 0.4 + 6;
  const done = commandDoneAt(terminalAt, COMMAND);
  const outAt = [Math.max(done + 8, at(s6, "repond", 0.5)), Math.max(done + 16, at(s6, "score", 0.75))];
  const lines = [
    ...FIT_CODE.map((code, i) => ({
      code,
      typeAt: fitStarts[i],
      fpc: 0.45,
      collapseAt: i < 6 ? s6.start : undefined,
      highlight:
        i === 7
          ? { from: fitStarts[7], to: fitAt, color: COLORS.yellow, badge: "2 QUESTIONS MAX" }
          : i === 8
            ? { from: fitAt, to: s6.start + 10, color: COLORS.green, badge: "FIT" }
            : undefined,
    })),
    ...(frame >= s6.start ? PREDICT_CODE.map((code, i) => ({ code, typeAt: printStarts[i], fpc: 0.4 })) : []),
  ];
  const codeShift = 80 * (1 - ease(s6.start, 30));
  const meaningIn = pop(outAt[0] + 4);
  const scoreIn = pop(outAt[1] + 4);

  // ---- Scene C: outro (segment 7) ------------------------------------------
  const sceneC = scene(s7.start, durationInFrames + 100);
  const plotC: PlotState = { pointsIn: STUDENTS.map(() => 1), split1: 1, leftZone: 1, split2: 1, rightZones: 1, student: pop(s7.start + 20) };

  return (
    <EpisodeShell
      timing={timing}
      seg={seg}
      titles={TITLES}
      durationInFrames={durationInFrames}
      showTikTokOverlay={showTikTokOverlay}
      watermark={watermark}
    >
      {sceneA.visible ? (
        <div style={sceneA.style}>
          <ExamPlot s={plotA} height={Math.round(600 - 100 * ease(s3.start, 20))} />
          {badgeIn > 0 ? (
            <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
              <SeriesBadge episode={3} topic="L'ARBRE DE DÉCISION" amount={badgeIn} />
            </div>
          ) : null}
          {legendIn > 0 ? (
            <InfoCard label="LES DONNÉES" color={COLORS.blue} style={{ opacity: Math.min(1, legendIn * 1.4) }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 34, color: "#e6edf3", lineHeight: 1.5 }}>
                <div>
                  <span style={{ fontFamily: FONT_CODE, color: COLORS.variable }}>X</span> = heures de révision et de sommeil
                </div>
                <div>
                  <span style={{ fontFamily: FONT_CODE, color: COLORS.variable }}>y</span> ={" "}
                  <span style={{ color: PASS }}>1 réussi</span> ou <span style={{ color: FAIL }}>0 raté</span>
                </div>
              </div>
            </InfoCard>
          ) : null}
          {treeIn ? (
            <div style={{ opacity: Math.min(1, ease(s3.start, 20) * 1.4), transform: `scale(${1 + 0.02 * flash})` }}>
              <TreeDiagram s={tree} width={W} height={380} />
            </div>
          ) : null}
        </div>
      ) : null}

      {sceneB.visible ? (
        <div style={{ ...sceneB.style, gap: 24, transform: `${sceneB.style.transform} translateY(${codeShift}px)` }}>
          <CodeRun
            lines={lines}
            fileName={FILE_NAME}
            terminal={{
              at: terminalAt,
              command: COMMAND,
              outputs: [
                { text: OUTPUT[0], at: outAt[0], color: PASS },
                { text: OUTPUT[1], at: outAt[1], color: COLORS.yellow },
              ],
            }}
          />
          {meaningIn > 0 ? (
            <InfoCard label="CE QUE ÇA VEUT DIRE" color={COLORS.green} style={{ opacity: Math.min(1, meaningIn * 1.4) }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 38, color: "white" }}>
                6 h révision · 7 h sommeil → <span style={{ color: PASS }}>RÉUSSI</span>
              </div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 30, color: "#c9d1d9", marginTop: 8, opacity: Math.min(1, scoreIn) }}>
                score <span style={{ color: COLORS.yellow }}>100 %</span>… sur les données qu'il a déjà vues
              </div>
            </InfoCard>
          ) : null}
        </div>
      ) : null}

      {sceneC.visible ? (
        <div style={{ ...sceneC.style, gap: 14 }}>
          <ExamPlot s={plotC} height={440} />
          <TakeawayCard at={at(s7, "facile", 0.2)} color={COLORS.blue} label="LISIBLE" detail="Des questions oui / non" />
          <TakeawayCard at={at(s7, "profond", 0.4)} color={COLORS.red} label="PAR CŒUR" detail="Trop profond : il apprend par cœur" />
          <TakeawayCard at={at(s7, "profond", 0.4) + 16} color={COLORS.yellow} label="100 % ?" detail="Teste-le sur des données jamais vues" />
          <div style={{ height: 4 }} />
          <Pill text="QUEL ALGO ENSUITE ? COMMENTE" color={COLORS.yellow} amount={pop(at(s7, "algo", 0.6))} />
          <Pill text="ABONNE-TOI" color={COLORS.red} textColor="white" amount={pop(at(s7, "abonnetoi", 0.9))} />
        </div>
      ) : null}
    </EpisodeShell>
  );
};
