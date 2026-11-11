import "../../fonts";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeRun, commandDoneAt, scheduleTyping } from "../../components/CodeRun";
import { EpisodeShell, Pill, SeriesBadge } from "../../components/Episode";
import { InfoCard } from "../../components/InfoCard";
import { Dot, Plot, Scales } from "../../components/Plot";
import { TitlePart } from "../../components/SceneTitle";
import { TakeawayCard } from "../../components/TakeawayCard";
import { clampLerp } from "../../lib/anim";
import { episodeTools } from "../../lib/episode";
import { TimedVideoProps } from "../../lib/timing";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { fr } from "../linear-regression/data";
import {
  BOUNDARY,
  COMMAND,
  FILE_NAME,
  FIT_CODE,
  LINKS,
  NEW_LINKS,
  NEW_PROBA,
  OUTPUT,
  PREDICT_CODE,
  SPAM,
  STRAIGHT,
  jitter,
  sigmoid,
} from "./data";

export const LOGISTIC_REGRESSION_ID = "logistic-regression";

const W = 900;
const MAIL = COLORS.blue; // real email
const SPAM_COLOR = COLORS.red;
const X_DOMAIN: [number, number] = [-0.5, 10];

const TITLES: TitlePart[][] = [
  [{ text: "Spam " }, { text: "ou pas ?", color: SPAM_COLOR }],
  [{ text: "Les " }, { text: "données", color: COLORS.blue }],
  [{ text: "La courbe " }, { text: "en S", color: COLORS.yellow }],
  [{ text: "Le " }, { text: "seuil", color: COLORS.yellow }],
  [{ text: "Le code " }, { text: "scikit-learn", color: COLORS.yellow }],
  [{ text: "Le " }, { text: "verdict", color: COLORS.green }],
  [{ text: "À " }, { text: "retenir", color: COLORS.yellow }],
];

const sigmoidPath = (sc: Scales, upTo: number) => {
  const pts: string[] = [];
  for (let x = X_DOMAIN[0]; x <= upTo + 1e-9; x += 0.1) {
    pts.push(`${pts.length ? "L" : "M"} ${sc.sx(x).toFixed(1)} ${sc.sy(sigmoid(x)).toFixed(1)}`);
  }
  return pts.join(" ");
};

type PlotState = {
  pointsIn: number[];
  bands: number; // highlight of the 0 / 1 rows
  mailBand: number;
  spamBand: number;
  straight: number;
  straightCross: number;
  sigmoid: number;
  sigmoidOpacity: number;
  threshold: number;
  zones: number;
  newMail: number;
};

const SpamPlot: React.FC<{ s: PlotState; height: number }> = ({ s, height }) => {
  const xs = jitter(LINKS, SPAM);
  return (
    <Plot
      width={W}
      height={height}
      xDomain={X_DOMAIN}
      yDomain={[-0.4, 1.4]}
      xTicks={[0, 2, 4, 6, 8, 10]}
      yTicks={[0, 0.5, 1]}
      formatY={(v) => `${v * 100} %`}
      xLabel="nombre de liens dans le mail"
      yLabel="proba de spam"
      children={(sc) => (
        <>
          {/* Decision zones */}
          {s.zones > 0 ? (
            <>
              <rect x={sc.left} y={sc.top} width={sc.sx(BOUNDARY) - sc.left} height={sc.bottom - sc.top} fill={MAIL} opacity={0.12 * s.zones} />
              <rect x={sc.sx(BOUNDARY)} y={sc.top} width={sc.right - sc.sx(BOUNDARY)} height={sc.bottom - sc.top} fill={SPAM_COLOR} opacity={0.12 * s.zones} />
              <line x1={sc.sx(BOUNDARY)} x2={sc.sx(BOUNDARY)} y1={sc.top} y2={sc.bottom} stroke="white" strokeWidth={3} strokeDasharray="6 8" opacity={s.zones} />
            </>
          ) : null}
          {/* Rows: real emails (0) and spams (1) */}
          {s.mailBand > 0 ? <rect x={sc.left} y={sc.sy(0) - 30} width={sc.right - sc.left} height={60} fill={MAIL} opacity={0.18 * s.mailBand} /> : null}
          {s.spamBand > 0 ? <rect x={sc.left} y={sc.sy(1) - 30} width={sc.right - sc.left} height={60} fill={SPAM_COLOR} opacity={0.18 * s.spamBand} /> : null}
          {/* Threshold */}
          {s.threshold > 0 ? (
            <line
              x1={sc.left}
              x2={sc.left + (sc.right - sc.left) * s.threshold}
              y1={sc.sy(0.5)}
              y2={sc.sy(0.5)}
              stroke={COLORS.yellow}
              strokeWidth={5}
              strokeDasharray="14 10"
            />
          ) : null}
          {/* Straight line (doesn't work) */}
          {s.straight > 0 ? (
            <line
              x1={sc.sx(X_DOMAIN[0])}
              y1={sc.sy(STRAIGHT.a * X_DOMAIN[0] + STRAIGHT.b)}
              x2={sc.sx(X_DOMAIN[0] + (X_DOMAIN[1] - X_DOMAIN[0]) * s.straight)}
              y2={sc.sy(STRAIGHT.a * (X_DOMAIN[0] + (X_DOMAIN[1] - X_DOMAIN[0]) * s.straight) + STRAIGHT.b)}
              stroke="#ff9f43"
              strokeWidth={7}
              strokeLinecap="round"
              opacity={1 - s.sigmoid * 0.85}
            />
          ) : null}
          {/* Sigmoid */}
          {s.sigmoid > 0 ? (
            <path
              d={sigmoidPath(sc, X_DOMAIN[0] + (X_DOMAIN[1] - X_DOMAIN[0]) * s.sigmoid)}
              fill="none"
              stroke={COLORS.green}
              strokeWidth={8}
              strokeLinecap="round"
              opacity={s.sigmoidOpacity}
              style={{ filter: `drop-shadow(0 0 12px ${COLORS.green})` }}
            />
          ) : null}
          {xs.map((x, i) => (
            <Dot key={i} x={sc.sx(x)} y={sc.sy(SPAM[i])} color={SPAM[i] ? SPAM_COLOR : MAIL} amount={s.pointsIn[i] ?? 0} />
          ))}
          {/* New email: 7 links */}
          {s.newMail > 0 ? (
            <g opacity={Math.min(1, s.newMail)}>
              <line x1={sc.sx(NEW_LINKS)} x2={sc.sx(NEW_LINKS)} y1={sc.bottom} y2={sc.sy(NEW_PROBA)} stroke={COLORS.yellow} strokeWidth={4} strokeDasharray="10 8" />
              <circle cx={sc.sx(NEW_LINKS)} cy={sc.sy(NEW_PROBA)} r={20 * s.newMail} fill={COLORS.yellow} stroke="black" strokeWidth={4} />
            </g>
          ) : null}
        </>
      )}
      overlay={(sc) => (
        <>
          {s.straightCross > 0 ? (
            <div
              style={{
                position: "absolute",
                left: sc.sx(7.2) - 150,
                top: sc.sy(1.3) - 10,
                width: 300,
                textAlign: "center",
                fontFamily: FONT_UI,
                fontWeight: 900,
                fontSize: 32,
                color: "#ff9f43",
                textShadow: "0 0 8px black",
                opacity: Math.min(1, s.straightCross),
                transform: `scale(${0.6 + 0.4 * Math.min(1, s.straightCross)})`,
              }}
            >
              ✗ dépasse 100 % !
            </div>
          ) : null}
          {s.mailBand > 0 ? (
            <div style={{ position: "absolute", left: sc.sx(6), top: sc.sy(0) - 22, fontFamily: FONT_UI, fontWeight: 900, fontSize: 30, color: MAIL, opacity: s.mailBand }}>
              VRAIS MAILS
            </div>
          ) : null}
          {s.spamBand > 0 ? (
            <div style={{ position: "absolute", left: sc.sx(0), top: sc.sy(1) - 22, fontFamily: FONT_UI, fontWeight: 900, fontSize: 30, color: SPAM_COLOR, opacity: s.spamBand }}>
              SPAMS
            </div>
          ) : null}
          {s.threshold > 0 ? (
            <div style={{ position: "absolute", right: 40, top: sc.sy(0.5) - 48, fontFamily: FONT_UI, fontWeight: 900, fontSize: 28, color: COLORS.yellow, opacity: Math.min(1, s.threshold) }}>
              seuil 50 %
            </div>
          ) : null}
          {s.newMail > 0 ? (
            <div
              style={{
                position: "absolute",
                right: 900 - sc.sx(NEW_LINKS) + 14,
                top: sc.sy(0.32) - 22,
                padding: "8px 18px",
                borderRadius: 14,
                backgroundColor: COLORS.yellow,
                color: "#111",
                fontFamily: FONT_UI,
                fontWeight: 900,
                fontSize: 30,
                opacity: Math.min(1, s.newMail),
              }}
            >
              7 liens → {fr(NEW_PROBA * 100, 0)} % spam
            </div>
          ) : null}
        </>
      )}
    />
  );
};

export const LogisticEpisode: React.FC<TimedVideoProps> = ({ showTikTokOverlay, watermark, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!timing) return <AbsoluteFill style={{ backgroundColor: "black" }} />;

  const { seg, at, pop, ease, fadeOut, scene } = episodeTools(frame, timing, durationInFrames, 7);
  const [s1, s2, s3, s4, s5, s6, s7] = seg;

  // ---- Scene A: plot (segments 1-4) ----------------------------------------
  const sceneA = scene(s1.start, s5.start);
  const teaser = frame < s2.start;
  const plotA: PlotState = {
    pointsIn: LINKS.map((_, i) => pop(s1.start + 8 + i * 4)),
    bands: 0,
    mailBand: ease(at(s2, "bas", 0.5)) * fadeOut(s3.start),
    spamBand: ease(at(s2, "haut", 0.75)) * fadeOut(s3.start),
    straight: ease(at(s3, "droite", 0.05), 30),
    straightCross: pop(at(s3, "ici", 0.15)) * fadeOut(at(s3, "courbe", 0.4)),
    sigmoid: teaser ? ease(s1.start + 40, 50) : ease(at(s3, "courbe", 0.4), 45),
    sigmoidOpacity: teaser ? fadeOut(s2.start, 20) : 1,
    threshold: ease(at(s4, "seuil", 0.15), 30),
    zones: ease(at(s4, "audessus", 0.4), 20),
    newMail: 0,
  };
  if (teaser) {
    plotA.straight = 0;
  } else if (frame < s3.start) {
    plotA.sigmoid = 0;
  }

  const badgeIn = pop(s1.start + 30) * fadeOut(s2.start);
  const legendIn = pop(s2.start + 10) * fadeOut(s3.start);
  const formulaIn = pop(at(s3, "sigmoide", 0.5)) * fadeOut(s4.start);
  const ruleIn = pop(at(s4, "seuil", 0.2));
  const ruleRows = [
    { text: "au-dessus de 50 %", verdict: "SPAM", color: SPAM_COLOR, in: pop(at(s4, "audessus", 0.4)) },
    { text: "en dessous de 50 %", verdict: "VRAI MAIL", color: MAIL, in: pop(at(s4, "dessous", 0.75)) },
  ];

  // ---- Scene B: code (segments 5-6) ----------------------------------------
  const sceneB = scene(s5.start, s7.start);
  const fitStarts = scheduleTyping(FIT_CODE, s5.start + 16, 0.55, {
    5: at(s5, "cree", 0.6),
    6: at(s5, "entraine", 0.85),
  });
  const fitAt = at(s5, "fit", 0.95);
  const printStarts = scheduleTyping(PREDICT_CODE, s6.start + 12, 0.45);
  const terminalAt = printStarts[printStarts.length - 1] + PREDICT_CODE[PREDICT_CODE.length - 1].length * 0.45 + 6;
  const done = commandDoneAt(terminalAt, COMMAND);
  const outAt = [Math.max(done + 8, at(s6, "repond", 0.3)), Math.max(done + 16, at(s6, "proba", 0.55, 1))];
  const lines = [
    ...FIT_CODE.map((code, i) => ({
      code,
      typeAt: fitStarts[i],
      collapseAt: i < 5 ? s6.start : undefined,
      highlight:
        i === 5
          ? { from: fitStarts[5], to: fitAt, color: COLORS.blue, badge: "MODÈLE" }
          : i === 6
            ? { from: fitAt, to: s6.start + 10, color: COLORS.green, badge: "ENTRAÎNEMENT" }
            : undefined,
    })),
    ...(frame >= s6.start ? PREDICT_CODE.map((code, i) => ({ code, typeAt: printStarts[i], fpc: 0.45 })) : []),
  ];
  const codeShift = 110 * (1 - ease(s6.start, 30));
  const verdictIn = pop(outAt[0] + 4);
  const probaBar = ease(outAt[1], 40);

  // ---- Scene C: outro (segment 7) ------------------------------------------
  const sceneC = scene(s7.start, durationInFrames + 100);
  const plotC: PlotState = {
    pointsIn: LINKS.map(() => 1),
    bands: 0,
    mailBand: 0,
    spamBand: 0,
    straight: 0,
    straightCross: 0,
    sigmoid: 1,
    sigmoidOpacity: 1,
    threshold: 1,
    zones: 1,
    newMail: pop(s7.start + 20),
  };

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
          <SpamPlot s={plotA} height={600} />
          {badgeIn > 0 ? (
            <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
              <SeriesBadge episode={1} topic="LA RÉGRESSION LOGISTIQUE" amount={badgeIn} />
            </div>
          ) : null}
          {legendIn > 0 ? (
            <InfoCard label="LES DONNÉES" color={COLORS.blue} style={{ opacity: Math.min(1, legendIn * 1.4) }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 34, color: "#e6edf3", lineHeight: 1.5 }}>
                <div>
                  <span style={{ fontFamily: FONT_CODE, color: COLORS.variable }}>X</span> = nombre de liens
                </div>
                <div>
                  <span style={{ fontFamily: FONT_CODE, color: COLORS.variable }}>y</span> ={" "}
                  <span style={{ color: MAIL }}>0 vrai mail</span> ou <span style={{ color: SPAM_COLOR }}>1 spam</span>
                </div>
              </div>
            </InfoCard>
          ) : null}
          {formulaIn > 0 ? (
            <InfoCard label="LA SIGMOÏDE" color={COLORS.green} style={{ opacity: Math.min(1, formulaIn * 1.4) }}>
              <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 44, color: "white" }}>
                p = 1 / (1 + e<sup style={{ fontSize: 28 }}>−(a·x + b)</sup>)
              </div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 30, color: "#c9d1d9", marginTop: 6 }}>
                → toujours entre <span style={{ color: COLORS.green }}>0 % et 100 %</span>
              </div>
            </InfoCard>
          ) : null}
          {ruleIn > 0 && frame >= s4.start ? (
            <InfoCard label={`SEUIL 50 % → FRONTIÈRE À ${fr(BOUNDARY, 1)} LIENS`} color={COLORS.yellow} style={{ opacity: Math.min(1, ruleIn * 1.4) }}>
              {ruleRows.map((r) => (
                <div
                  key={r.verdict}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    height: 58,
                    opacity: Math.min(1, r.in * 1.4),
                    transform: `translateX(${(1 - r.in) * 60}px)`,
                  }}
                >
                  <span style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 34, color: "#e6edf3" }}>{r.text}</span>
                  <span style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 42, color: r.color }}>{r.verdict}</span>
                </div>
              ))}
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
                { text: OUTPUT[0], at: outAt[0], color: COLORS.red },
                { text: OUTPUT[1], at: outAt[1], color: COLORS.green },
              ],
            }}
          />
          {verdictIn > 0 ? (
            <InfoCard label="CE QUE ÇA VEUT DIRE" color={COLORS.green} style={{ opacity: Math.min(1, verdictIn * 1.4) }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 40, color: "white" }}>
                7 liens → <span style={{ color: SPAM_COLOR }}>1 = SPAM</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
                <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 34, color: COLORS.green, whiteSpace: "nowrap" }}>
                  {fr(NEW_PROBA * 100 * clampLerp(probaBar, [0, 1], [0, 1]), 0)} %
                </div>
                <div style={{ flex: 1, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ width: `${NEW_PROBA * 100 * probaBar}%`, height: "100%", borderRadius: 13, backgroundColor: SPAM_COLOR }} />
                </div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 26, color: "#c9d1d9" }}>de risque</div>
              </div>
            </InfoCard>
          ) : null}
        </div>
      ) : null}

      {sceneC.visible ? (
        <div style={{ ...sceneC.style, gap: 14 }}>
          <SpamPlot s={plotC} height={440} />
          <TakeawayCard at={at(s7, "classification", 0.2)} color={COLORS.blue} label="CLASSIFICATION" detail="Répond oui / non" />
          <TakeawayCard at={at(s7, "classification", 0.2) + 14} color={COLORS.green} label="PROBABILITÉ" detail="predict_proba donne le %" />
          <TakeawayCard at={at(s7, "classification", 0.2) + 28} color={COLORS.yellow} label="SEUIL" detail="50 % par défaut" />
          <div style={{ height: 4 }} />
          <Pill text="DEMAIN · #2 LE KNN" color={COLORS.yellow} amount={pop(at(s7, "demain", 0.5))} />
          <Pill text="ABONNE-TOI" color={COLORS.red} textColor="white" amount={pop(at(s7, "abonnetoi", 0.8))} />
        </div>
      ) : null}
    </EpisodeShell>
  );
};
