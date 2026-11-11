import "../../fonts";
import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeRun, commandDoneAt, scheduleTyping } from "../../components/CodeRun";
import { EpisodeShell, Pill, SeriesBadge } from "../../components/Episode";
import { InfoCard } from "../../components/InfoCard";
import { Dot, Plot } from "../../components/Plot";
import { TitlePart } from "../../components/SceneTitle";
import { TakeawayCard } from "../../components/TakeawayCard";
import { episodeTools } from "../../lib/episode";
import { TimedVideoProps } from "../../lib/timing";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { ANIMALS, COMMAND, FILE_NAME, FIT_CODE, LABELS, NEIGHBORS, NEW_ANIMAL, OUTPUT, PREDICT_CODE } from "./data";

export const KNN_ID = "knn";

const W = 900;
const CAT = COLORS.blue;
const DOG = "#ff9f43";
const colorOf = (i: number) => (LABELS[i] === "chat" ? CAT : DOG);

const TITLES: TitlePart[][] = [
  [{ text: "Chat " }, { text: "ou chien ?", color: DOG }],
  [{ text: "Les " }, { text: "données", color: COLORS.blue }],
  [{ text: "Les 3 " }, { text: "voisins", color: COLORS.yellow }],
  [{ text: "Le " }, { text: "vote", color: COLORS.yellow }],
  [{ text: "Le code " }, { text: "scikit-learn", color: COLORS.yellow }],
  [{ text: "Le " }, { text: "verdict", color: COLORS.green }],
  [{ text: "À " }, { text: "retenir", color: COLORS.yellow }],
];

type PlotState = {
  pointsIn: number[];
  newIn: number;
  ring: number; // search pulse
  links: number[]; // lines to the 3 neighbours
  voteGlow: number;
  verdict: number; // new point turns into a cat
};

const AnimalPlot: React.FC<{ s: PlotState; height: number; frame: number }> = ({ s, height, frame }) => {
  const newColor = interpolateColors(s.verdict, [0, 1], ["#ffffff", CAT]);
  return (
    <Plot
      width={W}
      height={height}
      xDomain={[2, 12]}
      yDomain={[20, 48]}
      xTicks={[2, 4, 6, 8, 10, 12]}
      yTicks={[20, 30, 40]}
      xLabel="poids (kg)"
      yLabel="taille (cm)"
      children={(sc) => (
        <>
          {/* Search pulse around the new animal */}
          {s.ring > 0 && s.newIn > 0 ? (
            <circle
              cx={sc.sx(NEW_ANIMAL[0])}
              cy={sc.sy(NEW_ANIMAL[1])}
              r={40 + 120 * ((frame % 40) / 40)}
              fill="none"
              stroke={COLORS.yellow}
              strokeWidth={4}
              opacity={s.ring * (1 - (frame % 40) / 40)}
            />
          ) : null}
          {/* Lines to the neighbours */}
          {NEIGHBORS.map((idx, k) => {
            const p = s.links[k] ?? 0;
            if (p <= 0) return null;
            const [x0, y0] = [sc.sx(NEW_ANIMAL[0]), sc.sy(NEW_ANIMAL[1])];
            const [x1, y1] = [sc.sx(ANIMALS[idx][0]), sc.sy(ANIMALS[idx][1])];
            return (
              <line
                key={idx}
                x1={x0}
                y1={y0}
                x2={x0 + (x1 - x0) * p}
                y2={y0 + (y1 - y0) * p}
                stroke={COLORS.yellow}
                strokeWidth={5}
                strokeDasharray="10 8"
              />
            );
          })}
          {ANIMALS.map(([x, y], i) => {
            const isNeighbor = NEIGHBORS.includes(i);
            return (
              <Dot
                key={i}
                x={sc.sx(x)}
                y={sc.sy(y)}
                r={isNeighbor ? 17 + 6 * s.voteGlow : 17}
                color={colorOf(i)}
                amount={s.pointsIn[i] ?? 0}
                stroke={isNeighbor && s.voteGlow > 0 ? COLORS.yellow : "white"}
              />
            );
          })}
          {s.newIn > 0 ? (
            <g>
              <circle
                cx={sc.sx(NEW_ANIMAL[0])}
                cy={sc.sy(NEW_ANIMAL[1])}
                r={22 * Math.min(1.2, s.newIn)}
                fill={newColor}
                stroke="black"
                strokeWidth={4}
                style={{ filter: `drop-shadow(0 0 14px ${newColor})` }}
              />
              <text
                x={sc.sx(NEW_ANIMAL[0])}
                y={sc.sy(NEW_ANIMAL[1]) + 11}
                textAnchor="middle"
                style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 30, fill: "#111" }}
                opacity={1 - s.verdict}
              >
                ?
              </text>
            </g>
          ) : null}
        </>
      )}
      overlay={(sc) => (
        <>
          {NEIGHBORS.map((idx, k) =>
            (s.links[k] ?? 0) >= 1 ? (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  left: sc.sx(ANIMALS[idx][0]) - 54,
                  top: sc.sy(ANIMALS[idx][1]) - 18,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: COLORS.yellow,
                  color: "#111",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_UI,
                  fontWeight: 900,
                  fontSize: 22,
                }}
              >
                {k + 1}
              </div>
            ) : null,
          )}
          {s.verdict > 0 ? (
            <div
              style={{
                position: "absolute",
                left: sc.sx(NEW_ANIMAL[0]) + 34,
                top: sc.sy(NEW_ANIMAL[1]) - 4,
                padding: "6px 16px",
                borderRadius: 12,
                backgroundColor: CAT,
                color: "#06121c",
                fontFamily: FONT_UI,
                fontWeight: 900,
                fontSize: 30,
                opacity: Math.min(1, s.verdict),
                transform: `scale(${0.6 + 0.4 * Math.min(1, s.verdict)})`,
              }}
            >
              CHAT !
            </div>
          ) : null}
        </>
      )}
    />
  );
};

export const KnnEpisode: React.FC<TimedVideoProps> = ({ showTikTokOverlay, watermark, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!timing) return <AbsoluteFill style={{ backgroundColor: "black" }} />;

  const { seg, at, pop, ease, fadeOut, scene } = episodeTools(frame, timing, durationInFrames, 7);
  const [s1, s2, s3, s4, s5, s6, s7] = seg;

  // ---- Scene A: plot (segments 1-4) ----------------------------------------
  const sceneA = scene(s1.start, s5.start);
  const teaser = frame < s2.start;
  const linksAt = at(s3, "voisins", 0.75);
  const plotA: PlotState = {
    pointsIn: ANIMALS.map((_, i) => pop(s1.start + 8 + i * 4)),
    newIn: teaser ? pop(s1.start + 60) * fadeOut(s2.start) : pop(at(s3, "arrive", 0.15)),
    ring: teaser ? 1 : ease(at(s3, "cherche", 0.6)) * fadeOut(linksAt + 40),
    links: NEIGHBORS.map((_, k) => ease(linksAt + k * 12, 18)),
    voteGlow: ease(at(s4, "voter", 0.15)),
    verdict: ease(at(s4, "verdict", 0.7), 20),
  };
  const badgeIn = pop(s1.start + 30) * fadeOut(s2.start);
  const legendIn = pop(s2.start + 10) * fadeOut(s3.start);
  const newCardIn = pop(at(s3, "arrive", 0.15)) * fadeOut(s4.start);
  const kIn = pop(at(s3, "trois", 0.7));
  const voteIn = pop(at(s4, "voter", 0.15));
  const catVotes = pop(at(s4, "deux", 0.3));
  const dogVotes = pop(at(s4, "chien", 0.45));
  const verdictCard = pop(at(s4, "verdict", 0.7));

  // ---- Scene B: code (segments 5-6) ----------------------------------------
  const sceneB = scene(s5.start, s7.start);
  const fitStarts = scheduleTyping(FIT_CODE, s5.start + 14, 0.5, {
    6: at(s5, "choisit", 0.55),
    7: at(s5, "fit", 0.85),
  });
  const fitAt = at(s5, "fit", 0.9);
  const printStarts = scheduleTyping(PREDICT_CODE, s6.start + 10, 0.4);
  const terminalAt = printStarts[1] + PREDICT_CODE[1].length * 0.4 + 6;
  const done = commandDoneAt(terminalAt, COMMAND);
  const outAt = [Math.max(done + 8, at(s6, "chat", 0.2)), Math.max(done + 16, at(s6, "vote", 0.6))];
  const lines = [
    ...FIT_CODE.map((code, i) => ({
      code,
      typeAt: fitStarts[i],
      fpc: 0.5,
      collapseAt: i < 6 ? s6.start : undefined,
      highlight:
        i === 6
          ? { from: fitStarts[6], to: fitAt, color: COLORS.yellow, badge: "k = 3" }
          : i === 7
            ? { from: fitAt, to: s6.start + 10, color: COLORS.green, badge: "FIT" }
            : undefined,
    })),
    ...(frame >= s6.start ? PREDICT_CODE.map((code, i) => ({ code, typeAt: printStarts[i], fpc: 0.4 })) : []),
  ];
  const codeShift = 100 * (1 - ease(s6.start, 30));
  const meaningIn = pop(outAt[0] + 4);
  const voteBar = ease(outAt[1], 30);

  // ---- Scene C: outro (segment 7) ------------------------------------------
  const sceneC = scene(s7.start, durationInFrames + 100);
  const plotC: PlotState = { pointsIn: ANIMALS.map(() => 1), newIn: 1, ring: 0, links: [1, 1, 1], voteGlow: 1, verdict: 1 };

  const voteChip = (label: string, n: number, color: string, amount: number) => (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        borderRadius: 18,
        border: `4px solid ${color}`,
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.6 + 0.4 * Math.min(1, amount)})`,
      }}
    >
      <span style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 40, color }}>{label}</span>
      <span style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 56, color: "white" }}>{n}</span>
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
      {sceneA.visible ? (
        <div style={sceneA.style}>
          <AnimalPlot s={plotA} height={600} frame={frame} />
          {badgeIn > 0 ? (
            <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
              <SeriesBadge episode={2} topic="LE KNN (K PLUS PROCHES VOISINS)" amount={badgeIn} />
            </div>
          ) : null}
          {legendIn > 0 ? (
            <InfoCard label="LES DONNÉES" color={COLORS.blue} style={{ opacity: Math.min(1, legendIn * 1.4) }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 34, color: "#e6edf3", lineHeight: 1.5 }}>
                <div>
                  <span style={{ fontFamily: FONT_CODE, color: COLORS.variable }}>X</span> = poids et taille
                </div>
                <div>
                  <span style={{ fontFamily: FONT_CODE, color: COLORS.variable }}>y</span> ={" "}
                  <span style={{ color: CAT }}>chat</span> ou <span style={{ color: DOG }}>chien</span>
                </div>
              </div>
            </InfoCard>
          ) : null}
          {newCardIn > 0 ? (
            <InfoCard label="NOUVEL ANIMAL" color={COLORS.yellow} style={{ opacity: Math.min(1, newCardIn * 1.4) }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 44, color: "white" }}>6 kg · 28 cm → ?</div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 32, color: COLORS.yellow, marginTop: 6, opacity: kIn }}>
                on regarde ses k = 3 plus proches voisins
              </div>
            </InfoCard>
          ) : null}
          {voteIn > 0 && frame >= s4.start ? (
            <InfoCard label="LE VOTE DES 3 VOISINS" color={COLORS.yellow} style={{ opacity: Math.min(1, voteIn * 1.4) }}>
              <div style={{ display: "flex", gap: 20 }}>
                {voteChip("CHAT", 2, CAT, catVotes)}
                {voteChip("CHIEN", 1, DOG, dogVotes)}
              </div>
              <div
                style={{
                  marginTop: 14,
                  textAlign: "center",
                  fontFamily: FONT_UI,
                  fontWeight: 900,
                  fontSize: 44,
                  color: CAT,
                  opacity: Math.min(1, verdictCard * 1.4),
                  transform: `scale(${0.6 + 0.4 * Math.min(1, verdictCard)})`,
                }}
              >
                VERDICT : CHAT
              </div>
            </InfoCard>
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
                { text: OUTPUT[0], at: outAt[0], color: CAT },
                { text: OUTPUT[1], at: outAt[1], color: COLORS.green },
              ],
            }}
          />
          {meaningIn > 0 ? (
            <InfoCard label="CE QUE ÇA VEUT DIRE" color={COLORS.green} style={{ opacity: Math.min(1, meaningIn * 1.4) }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 40, color: "white" }}>
                6 kg · 28 cm → <span style={{ color: CAT }}>CHAT</span>
              </div>
              <div style={{ display: "flex", height: 44, borderRadius: 14, overflow: "hidden", marginTop: 12 }}>
                <div style={{ flex: 2 * voteBar + 0.0001, backgroundColor: CAT, display: "flex", alignItems: "center", paddingLeft: 14, fontFamily: FONT_UI, fontWeight: 900, fontSize: 24, color: "#06121c" }}>
                  {voteBar > 0.6 ? "2/3 chat" : ""}
                </div>
                <div style={{ flex: 1 * voteBar + 0.0001, backgroundColor: DOG, display: "flex", alignItems: "center", paddingLeft: 14, fontFamily: FONT_UI, fontWeight: 900, fontSize: 24, color: "#1c1006" }}>
                  {voteBar > 0.6 ? "1/3 chien" : ""}
                </div>
                <div style={{ flex: 3 * (1 - voteBar) + 0.0001, backgroundColor: "rgba(255,255,255,0.08)" }} />
              </div>
            </InfoCard>
          ) : null}
        </div>
      ) : null}

      {sceneC.visible ? (
        <div style={{ ...sceneC.style, gap: 14 }}>
          <AnimalPlot s={plotC} height={440} frame={frame} />
          <TakeawayCard at={at(s7, "memorise", 0.2)} color={COLORS.blue} label="MÉMORISE" detail="Pas d'entraînement : il garde tout" />
          <TakeawayCard at={at(s7, "impair", 0.4)} color={COLORS.yellow} label="K IMPAIR" detail="Pas d'égalité au vote" />
          <TakeawayCard at={at(s7, "echelle", 0.6)} color={DOG} label="ÉCHELLE" detail="kg et cm : mets-les à la même échelle" />
          <div style={{ height: 4 }} />
          <Pill text="DEMAIN · #3 L'ARBRE DE DÉCISION" color={COLORS.yellow} amount={pop(at(s7, "demain", 0.75))} />
          <Pill text="ABONNE-TOI" color={COLORS.red} textColor="white" amount={pop(at(s7, "decision", 0.9) + 20)} />
        </div>
      ) : null}
    </EpisodeShell>
  );
};
