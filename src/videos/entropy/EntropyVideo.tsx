import "../../fonts";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeRun, commandDoneAt, scheduleTyping } from "../../components/CodeRun";
import { EpisodeShell, Pill, SeriesBadge } from "../../components/Episode";
import { InfoCard } from "../../components/InfoCard";
import { Plot } from "../../components/Plot";
import { TitlePart } from "../../components/SceneTitle";
import { createCues, SfxTrack } from "../../components/Sfx";
import { TakeawayCard } from "../../components/TakeawayCard";
import { episodeTools } from "../../lib/episode";
import { TimedVideoProps } from "../../lib/timing";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { EntropyGauge, EntropyJar } from "../decision-tree/Entropy";
import { TreeDiagram } from "../decision-tree/TreeDiagram";
import { fr } from "../linear-regression/data";
import { CardGame } from "./CardGame";
import { Coin, Flip } from "./Coin";
import { CODE, coinEntropy, COMMAND, FILE_NAME, OUTPUT, PALETTE } from "./data";
import { ChaosBox, ChapterBar, ChapterList, EpisodeTeaser, heatColor, KineticWord, ProbBars, SplitDemo } from "./Visuals";

export const ENTROPY_ID = "entropy";

const W = 900;
const TOP = 236; // below headline + chapter bar
const ORANGE = "#ff9f43";

const TITLES: TitlePart[][] = [
  [],
  [{ text: "Le " }, { text: "plan", color: COLORS.yellow }],
  [{ text: "La pièce " }, { text: "truquée", color: COLORS.red }],
  [{ text: "La pièce " }, { text: "normale", color: COLORS.blue }],
  [{ text: "L'idée " }, { text: "clé", color: COLORS.yellow }],
  [{ text: "Le jeu des " }, { text: "8 cartes", color: COLORS.blue }],
  [{ text: "Oui " }, { text: "ou non ?", color: COLORS.yellow }],
  [{ text: "Information " }, { text: "= surprise", color: COLORS.yellow }],
  [{ text: "La " }, { text: "formule", color: COLORS.yellow }],
  [{ text: "Pièce normale : " }, { text: "calcul", color: COLORS.blue }],
  [{ text: "Pièce truquée : " }, { text: "calcul", color: COLORS.red }],
  [{ text: "La " }, { text: "courbe", color: COLORS.green }],
  [{ text: "Plus de " }, { text: "choix", color: COLORS.yellow }],
  [{ text: "Dans un " }, { text: "arbre", color: COLORS.green }],
  [{ text: "Pour aller " }, { text: "plus loin", color: COLORS.yellow }],
  [{ text: "En " }, { text: "Python", color: COLORS.blue }],
  [{ text: "À " }, { text: "retenir", color: COLORS.yellow }],
  [{ text: "Ton " }, { text: "défi", color: COLORS.yellow }],
];

const UNCERTAINTY = { title: "INCERTITUDE", leftLabel: "0 · PRÉVISIBLE", rightLabel: "MAX · IMPRÉVISIBLE" };

export const EntropyVideo: React.FC<TimedVideoProps> = ({ showTikTokOverlay, watermark, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!timing) return <AbsoluteFill style={{ backgroundColor: "black" }} />;

  const { seg, at, pop: popRaw, ease, fadeOut, scene } = episodeTools(frame, timing, durationInFrames, 18);
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18] = seg;
  const { events, cue } = createCues();
  const pop = (start: number, volume?: number) => popRaw(cue(start, "pop", { volume }));
  const ding = (start: number) => popRaw(cue(start, "ding"));
  seg.forEach((w, i) => i > 0 && cue(w.start, "whoosh"));
  const sc = (start: number, end: number) => scene(start, end, TOP);

  // ---- Chapter bar ---------------------------------------------------------
  const segIndex = seg.reduce((acc, w, i) => (frame >= w.start ? i : acc), 0);
  const chapterOf = (i: number) => (i >= 2 && i <= 4 ? 0 : i >= 5 && i <= 7 ? 1 : i >= 8 && i <= 12 ? 2 : i >= 13 && i <= 14 ? 3 : -1);
  const active = chapterOf(segIndex);
  const done = segIndex >= 15 ? 4 : active === -1 ? 0 : active;
  const barIn = ease(s2.start, 20);

  // ======================= A: hook (1) =======================================
  const A = scene(s1.start, s2.start, 40);
  const LETTERS = "ENTROPIE";
  LETTERS.split("").forEach((_, i) => cue(s1.start + 4 + i * 5, "pop", { volume: 0.4 }));
  const fearChip = pop(at(s1, "peur", 0.15));
  const simpleChip = ding(at(s1, "simple", 0.5));
  const calm = ease(at(s1, "simple", 0.5), 40);
  const detailBadge = pop(at(s1, "temps", 0.75));

  // ======================= B: plan (2) =======================================
  const B = sc(s2.start, s3.start);
  const planIns = [
    pop(at(s2, "surprise", 0.25)),
    pop(at(s2, "information", 0.35)),
    pop(at(s2, "entropie", 0.5)),
    pop(at(s2, "arbre", 0.8)),
  ];

  // ======================= C: coins + uncertainty (3-5) ======================
  const C = sc(s3.start, s6.start);
  const riggedFlips: Flip[] = [
    { at: at(s3, "toujours", 0.25) - 8, result: "P" },
    { at: at(s3, "lances", 0.45), result: "P" },
  ];
  const fairFlips: Flip[] = [
    { at: at(s4, "normale", 0.15) - 6, result: "F" },
    { at: at(s4, "cinquantecinquante", 0.3) - 4, result: "P" },
    { at: at(s4, "impossible", 0.5), result: "F" },
    { at: at(s4, "prevoir", 0.6) + 34, result: "F" },
    { at: at(s4, "incertitude", 0.85) - 30, result: "P" },
  ];
  [...riggedFlips, ...fairFlips].forEach((f) => {
    cue(f.at, "whoosh", { volume: 0.22 });
    cue(f.at + 26, "tick");
  });
  const riggedIn = pop(s3.start + 10);
  const fairIn = pop(s4.start + 6);
  const surpriseZero = pop(at(s3, "surprise", 0.6));
  const gaugeC = pop(at(s3, "surprise", 0.6));
  const needleC =
    frame < s4.start
      ? 0
      : frame < s5.start
        ? ease(at(s4, "incertitude", 0.85), 25)
        : 1 - ease(at(s5, "zero", 0.5), 20) + ease(at(s5, "maximale", 0.75), 25);
  const definition = ding(at(s5, "mesure", 0.25));

  // ======================= D: 8-card game + bits (6-8) =======================
  const D = sc(s6.start, s9.start);
  const dealAt = at(s6, "jeu", 0.25);
  for (let i = 0; i < 8; i++) cue(dealAt + i * 5, "tick", { volume: 0.3 });
  const starAt = cue(at(s6, "cache", 0.4), "pop");
  const counterIn = pop(at(s6, "questions", 0.7));
  const howMany = pop(at(s6, "combien", 0.9));
  const asks = [
    { from: 0, to: 3, at: at(s7, "moitie", 0.05), answerAt: at(s7, "oui", 0.18), answer: true, q: "Dans la moitié gauche ?" },
    { from: 0, to: 1, at: at(s7, "paire", 0.3), answerAt: at(s7, "non", 0.4), answer: false, q: "Dans la première paire ?" },
    { from: 2, to: 2, at: at(s7, "troisieme", 0.5), answerAt: at(s7, "oui", 0.6, 2), answer: true, q: "Est-ce la 3e ?" },
  ];
  const revealAt = at(s7, "trouve", 0.65);
  ding(revealAt);
  const qIns = asks.map((a) => pop(a.at));
  const aIns = asks.map((a) => pop(a.answerAt));
  const answered = asks.filter((a) => frame >= a.answerAt).length;
  const bitsCard = ding(at(s7, "bits", 0.95));
  const questionsOut = fadeOut(s8.start, 14);
  const log8 = pop(at(s8, "log", 0.08));
  const rare = pop(at(s8, "rare", 0.28));
  const infoFormula = ding(at(s8, "moins", 0.42));
  const infoRows = [
    { p: "1", bits: 0, in: pop(at(s8, "un", 0.6, 2)) },
    { p: "1/2", bits: 1, in: pop(at(s8, "demi", 0.75)) },
    { p: "1/8", bits: 3, in: pop(at(s8, "huitieme", 0.9)) },
  ];

  // ======================= E: the formula (9) ================================
  const E = sc(s9.start, s10.start);
  const formulaIn = pop(s9.start + 8);
  const avgNote = pop(at(s9, "moyenne", 0.2));
  const infoNote = pop(at(s9, "information", 0.3));
  const official = ding(at(s9, "h", 0.65));

  // ======================= F: coin calculations (10-11) ======================
  const F = sc(s10.start, s12.start);
  const p = 0.5 + 0.4 * ease(at(s11, "quatrevingtdix", 0.1), 30);
  const barsIn = pop(s10.start + 8);
  const infoIn = ease(at(s10, "bit", 0.25));
  const fairTerms = [pop(at(s10, "demi", 0.18)), pop(at(s10, "plus", 0.3)), ding(at(s10, "resultat", 0.55))];
  const maxNote = pop(at(s10, "maximum", 0.8));
  const biasTerms = [pop(at(s11, "neuf", 0.3)), pop(at(s11, "trois", 0.55)), ding(at(s11, "quarantesept", 0.78))];
  const lessNote = pop(at(s11, "incertitude", 0.9));
  const inBiased = frame >= s11.start;
  const gaugeF = inBiased ? 1 - (1 - coinEntropy(0.9)) * ease(at(s11, "quarantesept", 0.78), 25) : ease(at(s10, "resultat", 0.55), 25);

  // ======================= G: the curve (12) =================================
  const G = sc(s12.start, s13.start);
  const curveDraw = ease(at(s12, "courbe", 0.45), 40);
  const sweepStart = at(s12, "courbe", 0.45) + 40;
  const sweep = Math.min(1, Math.max(0, (frame - sweepStart) / 90));
  const sweepP = 0.5 - 0.5 * Math.cos(sweep * Math.PI);
  const endsIn = pop(at(s12, "extremites", 0.68));
  const middleIn = ding(at(s12, "milieu", 0.88));
  const biasMark = pop(at(s12, "courbe", 0.45) + 20);

  // ======================= H: more choices (13) ==============================
  const Hs = sc(s13.start, s14.start);
  const jarAt = [at(s13, "deux", 0.15), at(s13, "quatre", 0.38), at(s13, "huit", 0.58)];
  const jars = [
    { label: "2 COULEURS", colors: [0, 1, 0, 1].map((i) => PALETTE[i]), h: 1, unit: " bit", start: jarAt[0], v: pop(at(s13, "bit", 0.3)) },
    { label: "4 COULEURS", colors: [0, 1, 2, 3, 0, 1, 2, 3].map((i) => PALETTE[i]), h: 2, unit: " bits", start: jarAt[1], v: pop(at(s13, "bits", 0.5)) },
    { label: "8 COULEURS", colors: PALETTE.slice(0, 8), h: 3, unit: " bits", start: jarAt[2], v: ding(at(s13, "bits", 0.68, 2)) },
  ].map((j) => ({ ...j, in: pop(j.start), balls: ease(j.start + 4, 30) }));
  const log2k = pop(at(s13, "possibilites", 0.82));

  // ======================= I: decision tree (14) =============================
  const I = sc(s14.start, s15.start);
  const parentIn = pop(s14.start + 10);
  const childrenIn = pop(at(s14, "purs", 0.3));
  const questionNode = pop(at(s14, "question", 0.7));
  const splitP = ease(cue(at(s14, "baisser", 0.78), "whoosh"), 40);
  const valuesIn = ease(at(s14, "entropie", 0.38));
  const gainCard = ding(at(s14, "gain", 0.9));

  // ======================= J: episode 3 teaser (15) ==========================
  const J = sc(s15.start, s16.start);
  const teaserIn = pop(s15.start + 8);
  const watchBtn = ding(at(s15, "va", 0.8));

  // ======================= K: Python (16) ====================================
  const K = sc(s16.start, s17.start);
  const starts = scheduleTyping(CODE, at(s16, "entropy", 0.15), 0.4, { 1: at(s16, "base", 0.25) });
  const typingEnd = starts[3] + CODE[3].length * 0.4;
  cue(starts[0], "typing", { duration: typingEnd - starts[0] });
  const terminalAt = typingEnd + 8;
  const cmdDone = commandDoneAt(terminalAt, COMMAND);
  cue(terminalAt + 6, "typing", { duration: cmdDone - terminalAt - 6 });
  const outAt = [
    Math.max(cmdDone + 6, at(s16, "bit", 0.5)),
    Math.max(cmdDone + 12, at(s16, "quarantesept", 0.8)),
    Math.max(cmdDone + 18, at(s16, "bits", 0.95)),
  ];
  outAt.forEach((o) => cue(o, "tick"));
  const chips = outAt.map((o) => pop(o + 4));

  // ======================= L: recap (17) =====================================
  const L = sc(s17.start, s18.start);
  const recapGauge = pop(s17.start + 6);
  const recapNeedle = 0.5 - 0.5 * ease(at(s17, "zero", 0.45), 20) + ease(at(s17, "maximum", 0.75), 25);
  const recapAt = [
    cue(at(s17, "incertitude", 0.25), "pop"),
    cue(at(s17, "zero", 0.45), "pop"),
    cue(at(s17, "maximum", 0.75), "pop"),
  ];

  // ======================= M: quiz (18) ======================================
  const M = sc(s18.start, durationInFrames + 100);
  const quizJar = pop(at(s18, "sac", 0.1));
  const quizColors = [...Array(27).fill(PALETTE[0]), PALETTE[1], PALETTE[2], PALETTE[3]];
  const quizQ = pop(at(s18, "entropie", 0.45));
  const optA = pop(at(s18, "grande", 0.55));
  const optB = pop(at(s18, "petite", 0.6));
  const commentPill = pop(at(s18, "commentaire", 0.8));
  const subPill = pop(at(s18, "abonnetoi", 0.9));

  // ---------------------------------------------------------------------------
  const big = (text: React.ReactNode, color: string, amount: number, size = 44) => (
    <div
      style={{
        alignSelf: "center",
        textAlign: "center",
        fontFamily: FONT_UI,
        fontWeight: 900,
        fontSize: size,
        color,
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.5 + 0.5 * Math.min(1, amount)})`,
        textShadow: "0 6px 24px rgba(0,0,0,0.6)",
      }}
    >
      {text}
    </div>
  );
  const term = (text: string, amount: number, color = "white") => (
    <span style={{ color, opacity: Math.min(1, amount * 1.4), display: "inline-block", transform: `translateY(${(1 - Math.min(1, amount)) * 20}px)` }}>
      {text}
    </span>
  );

  return (
    <EpisodeShell timing={timing} seg={seg} titles={TITLES} durationInFrames={durationInFrames} showTikTokOverlay={showTikTokOverlay} watermark={watermark}>
      <SfxTrack events={events} />

      {frame >= s2.start ? (
        <div style={{ position: "absolute", top: 158, left: 0, right: 0 }}>
          <ChapterBar active={active} done={done} progress={frame / durationInFrames} amount={barIn} />
        </div>
      ) : null}

      {/* ---------- A: hook ---------- */}
      {A.visible ? (
        <div style={{ ...A.style, gap: 26, alignItems: "center" }}>
          <KineticWord text={LETTERS} at={s1.start + 4} stagger={5} size={140} color={COLORS.yellow} />
          <div style={{ fontFamily: FONT_CODE, fontSize: 40, color: "rgba(255,255,255,0.55)", opacity: ease(s1.start + 50, 30) }}>
            H = −Σ p · log₂(p)
          </div>
          <ChaosBox width={860} height={460} amount={ease(s1.start + 30, 20)} calm={calm} />
          <div style={{ display: "flex", gap: 16 }}>
            <Pill text="LE MOT QUI FAIT PEUR" color={COLORS.red} textColor="white" amount={fearChip} />
            <Pill text="… MAIS SUPER SIMPLE" color={COLORS.green} amount={simpleChip} />
          </div>
          <Pill text="EXPLICATION DÉTAILLÉE · PAS À PAS" color={COLORS.yellow} amount={detailBadge} fontSize={36} />
        </div>
      ) : null}

      {/* ---------- B: plan ---------- */}
      {B.visible ? (
        <div style={{ ...B.style, top: TOP + 30 }}>
          <ChapterList ins={planIns} />
        </div>
      ) : null}

      {/* ---------- C: coins + uncertainty ---------- */}
      {C.visible ? (
        <div style={{ ...C.style, gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-around", height: 470 }}>
            <Coin flips={riggedFlips} label="TRUQUÉE" sublabel={surpriseZero > 0 ? "surprise : 0" : "toujours pile"} color={COLORS.red} amount={riggedIn} size={200} />
            <Coin flips={fairFlips} label="NORMALE" sublabel="50 % · 50 %" color={COLORS.blue} amount={fairIn} size={200} />
          </div>
          <EntropyGauge value={needleC} amount={gaugeC} width={W} {...UNCERTAINTY} />
          {definition > 0 && frame >= s5.start ? (
            <InfoCard label="DÉFINITION" color={COLORS.yellow} style={{ opacity: Math.min(1, definition * 1.4), transform: `scale(${0.85 + 0.15 * Math.min(1, definition)})` }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 44, color: "white", textAlign: "center" }}>
                ENTROPIE = <span style={{ color: COLORS.yellow }}>MESURE DE L'INCERTITUDE</span>
              </div>
            </InfoCard>
          ) : null}
        </div>
      ) : null}

      {/* ---------- D: card game + bits ---------- */}
      {D.visible ? (
        <div style={{ ...D.style, gap: 20 }}>
          <CardGame width={W} dealAt={dealAt} starAt={starAt} target={2} asks={asks} revealAt={revealAt} />
          {frame < s8.start + 14 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: questionsOut }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: Math.min(1, counterIn * 1.4) }}>
                <span style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 36, color: "#c9d1d9" }}>QUESTIONS OUI / NON</span>
                <span style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 64, color: COLORS.yellow }}>{answered}</span>
              </div>
              {frame < s7.start ? big("COMBIEN ?", COLORS.yellow, howMany, 90) : null}
              {asks.map((a, i) =>
                qIns[i] > 0 ? (
                  <div
                    key={a.q}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 22px",
                      borderRadius: 18,
                      backgroundColor: "rgba(13,17,23,0.85)",
                      border: "2px solid rgba(255,255,255,0.12)",
                      opacity: Math.min(1, qIns[i] * 1.4),
                      transform: `translateX(${(1 - Math.min(1, qIns[i])) * 100}px)`,
                    }}
                  >
                    <span style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 34, color: "white" }}>
                      Q{i + 1} · {a.q}
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_UI,
                        fontWeight: 900,
                        fontSize: 36,
                        color: a.answer ? COLORS.green : COLORS.red,
                        opacity: Math.min(1, aIns[i] * 1.4),
                        transform: `scale(${0.5 + 0.5 * Math.min(1, aIns[i])})`,
                        display: "inline-block",
                      }}
                    >
                      {a.answer ? "OUI" : "NON"}
                    </span>
                  </div>
                ) : null,
              )}
              {big(
                <>
                  3 QUESTIONS = <span style={{ color: COLORS.yellow }}>3 BITS</span>
                </>,
                "white",
                bitsCard,
                64,
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InfoCard label="8 CARTES → 3 QUESTIONS" color={COLORS.yellow} style={{ opacity: Math.min(1, log8 * 1.4) }}>
                <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 60, color: "white", textAlign: "center" }}>
                  log₂(8) = <span style={{ color: COLORS.yellow }}>3</span>
                </div>
              </InfoCard>
              {big("ÉVÉNEMENT RARE = PLUS D'INFORMATION", ORANGE, rare, 36)}
              <InfoCard label="INFORMATION D'UN ÉVÉNEMENT (EN BITS)" color={COLORS.green} style={{ opacity: Math.min(1, infoFormula * 1.4) }}>
                <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 56, color: "white", textAlign: "center", marginBottom: 10 }}>
                  I = <span style={{ color: COLORS.green }}>−log₂(p)</span>
                </div>
                {infoRows.map((r) => (
                  <div key={r.p} style={{ display: "flex", alignItems: "center", gap: 18, height: 60, opacity: Math.min(1, r.in * 1.4) }}>
                    <span style={{ width: 170, fontFamily: FONT_CODE, fontSize: 34, color: "#e6edf3" }}>p = {r.p}</span>
                    <div style={{ flex: 1, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <div style={{ width: `${(r.bits / 3) * 100 * Math.min(1, r.in)}%`, height: "100%", borderRadius: 15, backgroundColor: COLORS.green }} />
                    </div>
                    <span style={{ width: 130, textAlign: "right", fontFamily: FONT_UI, fontWeight: 900, fontSize: 36, color: COLORS.green }}>
                      {r.bits} bit{r.bits > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </InfoCard>
            </div>
          )}
        </div>
      ) : null}

      {/* ---------- E: formula ---------- */}
      {E.visible ? (
        <div style={{ ...E.style, top: TOP + 120, gap: 40, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, opacity: Math.min(1, formulaIn * 1.4), transform: `scale(${0.7 + 0.3 * Math.min(1, formulaIn)})` }}>
            <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 66, color: "white", whiteSpace: "nowrap" }}>H =</div>
            {[
              { text: "Σ p ×", note: "MOYENNE PONDÉRÉE", color: COLORS.blue, in: avgNote },
              { text: "(−log₂ p)", note: "INFORMATION", color: COLORS.green, in: infoNote },
            ].map((part) => (
              <div key={part.text} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    fontFamily: FONT_CODE,
                    fontWeight: 700,
                    fontSize: 66,
                    whiteSpace: "nowrap",
                    color: part.in > 0 ? part.color : "white",
                    padding: "0 10px",
                    borderRadius: 16,
                    backgroundColor: part.in > 0 ? `${part.color}22` : "transparent",
                  }}
                >
                  {part.text}
                </div>
                <div style={{ width: "92%", height: 18, borderLeft: `4px solid ${part.color}`, borderRight: `4px solid ${part.color}`, borderBottom: `4px solid ${part.color}`, borderRadius: "0 0 12px 12px", opacity: part.in }} />
                <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 30, color: part.color, opacity: Math.min(1, part.in * 1.4), transform: `scale(${0.6 + 0.4 * Math.min(1, part.in)})` }}>
                  {part.note}
                </div>
              </div>
            ))}
          </div>
          <InfoCard label="LA FORMULE OFFICIELLE (SHANNON)" color={COLORS.yellow} style={{ width: W, boxSizing: "border-box", opacity: Math.min(1, official * 1.4), transform: `scale(${0.8 + 0.2 * Math.min(1, official)})` }}>
            <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 66, color: COLORS.yellow, textAlign: "center" }}>H = −Σ p · log₂(p)</div>
          </InfoCard>
        </div>
      ) : null}

      {/* ---------- F: coin calculations ---------- */}
      {F.visible ? (
        <div style={{ ...F.style, gap: 18 }}>
          <ProbBars p={p} amount={barsIn} infoIn={infoIn} />
          <InfoCard label={inBiased ? "PIÈCE TRUQUÉE À 90 %" : "PIÈCE NORMALE"} color={inBiased ? COLORS.red : COLORS.blue}>
            <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: inBiased ? 33 : 40, color: "white", textAlign: "center", minHeight: 56, whiteSpace: "nowrap" }}>
              {inBiased ? (
                <>
                  H = {term("0,9 × 0,15", biasTerms[0])} {term("+ 0,1 × 3,32", biasTerms[1])}{" "}
                  {term(`≈ ${fr(coinEntropy(0.9), 2)} bit`, biasTerms[2], COLORS.yellow)}
                </>
              ) : (
                <>
                  H = {term("½ × 1", fairTerms[0])} {term("+ ½ × 1", fairTerms[1])} {term("= 1 bit", fairTerms[2], COLORS.yellow)}
                </>
              )}
            </div>
            <div style={{ textAlign: "center", fontFamily: FONT_UI, fontWeight: 800, fontSize: 30, color: COLORS.green, marginTop: 8, opacity: inBiased ? lessNote : maxNote }}>
              {inBiased ? "↓ moins d'incertitude" : "le maximum pour 2 résultats"}
            </div>
          </InfoCard>
          <EntropyGauge value={gaugeF} amount={barsIn} width={W} title="ENTROPIE" leftLabel="0 · PRÉVISIBLE" rightLabel="1 BIT · MAX" unit=" bit" />
        </div>
      ) : null}

      {/* ---------- G: the curve ---------- */}
      {G.visible ? (
        <div style={G.style}>
          <Plot
            width={W}
            height={760}
            xDomain={[0, 1]}
            yDomain={[0, 1.15]}
            xTicks={[0, 0.25, 0.5, 0.75, 1]}
            yTicks={[0, 0.5, 1]}
            formatX={(v) => `${Math.round(v * 100)} %`}
            formatY={(v) => fr(v, v === 0.5 ? 1 : 0)}
            xLabel="probabilité de pile (p)"
            yLabel="entropie (bits)"
            children={(scales) => {
              const pts: string[] = [];
              const maxP = curveDraw;
              for (let x = 0; x <= maxP + 1e-9; x += 0.005) pts.push(`${pts.length ? "L" : "M"} ${scales.sx(x).toFixed(1)} ${scales.sy(coinEntropy(x)).toFixed(1)}`);
              const dot = (x: number, color: string, r: number, amount: number) =>
                amount > 0 ? <circle cx={scales.sx(x)} cy={scales.sy(coinEntropy(x))} r={r * Math.min(1.2, amount)} fill={color} stroke="black" strokeWidth={4} /> : null;
              return (
                <>
                  {curveDraw > 0 ? <path d={pts.join(" ")} fill="none" stroke={COLORS.green} strokeWidth={8} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${COLORS.green})` }} /> : null}
                  {dot(0, COLORS.green, 16, endsIn)}
                  {dot(1, COLORS.green, 16, endsIn)}
                  {dot(0.9, COLORS.red, 14, biasMark)}
                  {dot(0.5, COLORS.yellow, 20, middleIn)}
                  {sweep > 0 && sweep < 1 ? dot(sweepP, "white", 14, 1) : null}
                </>
              );
            }}
            overlay={(scales) => (
              <>
                {biasMark > 0 ? (
                  <div style={{ position: "absolute", left: scales.sx(0.9) - 440, top: scales.sy(coinEntropy(0.9)) + 40, fontFamily: FONT_UI, fontWeight: 900, fontSize: 26, color: COLORS.red, opacity: Math.min(1, biasMark) }}>
                    pièce truquée (90 %) : 0,47 ↗
                  </div>
                ) : null}
                {middleIn > 0 ? (
                  <div style={{ position: "absolute", left: scales.sx(0.5) - 110, top: scales.sy(1) - 70, width: 220, textAlign: "center", padding: "6px 0", borderRadius: 12, backgroundColor: COLORS.yellow, fontFamily: FONT_UI, fontWeight: 900, fontSize: 28, color: "#111", opacity: Math.min(1, middleIn) }}>
                    MAX : 1 BIT
                  </div>
                ) : null}
                {endsIn > 0 ? (
                  <div style={{ position: "absolute", left: scales.left + 20, top: scales.bottom - 60, fontFamily: FONT_UI, fontWeight: 900, fontSize: 26, color: COLORS.green, opacity: Math.min(1, endsIn) }}>
                    0 : prévisible
                  </div>
                ) : null}
                {sweep > 0 && sweep < 1 ? (
                  <div style={{ position: "absolute", right: 40, top: 40, fontFamily: FONT_CODE, fontWeight: 700, fontSize: 32, color: heatColor(coinEntropy(sweepP)) }}>
                    p = {fr(sweepP, 2)} → H = {fr(coinEntropy(sweepP), 2)}
                  </div>
                ) : null}
              </>
            )}
          />
        </div>
      ) : null}

      {/* ---------- H: more choices ---------- */}
      {Hs.visible ? (
        <div style={{ ...Hs.style, gap: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", height: 420 }}>
            {jars.map((j) => (
              <EntropyJar
                key={j.label}
                passed={0}
                failed={0}
                colors={j.colors}
                ballRadius={28}
                perRow={4}
                label={j.label}
                h={j.h}
                unit={j.unit}
                accentValue={j.h / 3}
                amount={j.in}
                balls={j.balls}
                valueIn={j.v}
                width={290}
                height={420}
              />
            ))}
          </div>
          <InfoCard label="RÈGLE" color={COLORS.yellow} style={{ opacity: Math.min(1, log2k * 1.4), transform: `scale(${0.8 + 0.2 * Math.min(1, log2k)})` }}>
            <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 52, color: "white", textAlign: "center" }}>
              H max = <span style={{ color: COLORS.yellow }}>log₂(k)</span>
            </div>
            <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 30, color: "#c9d1d9", textAlign: "center", marginTop: 6 }}>
              k = nombre de possibilités, toutes à égalité
            </div>
          </InfoCard>
        </div>
      ) : null}

      {/* ---------- I: decision tree ---------- */}
      {I.visible ? (
        <div style={{ ...I.style, gap: 10 }}>
          <SplitDemo width={W} parentIn={parentIn} childrenIn={childrenIn} questionIn={questionNode} split={splitP} valuesIn={valuesIn} />
          <InfoCard label="GAIN D'INFORMATION" color={COLORS.green} style={{ opacity: Math.min(1, gainCard * 1.4), transform: `scale(${0.8 + 0.2 * Math.min(1, gainCard)})` }}>
            <div style={{ fontFamily: FONT_CODE, fontWeight: 700, fontSize: 48, color: "white", textAlign: "center" }}>
              1 − 0 = <span style={{ color: COLORS.green }}>1 bit gagné</span>
            </div>
            <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 28, color: "#c9d1d9", textAlign: "center", marginTop: 6 }}>
              l'arbre choisit la question au plus grand gain
            </div>
          </InfoCard>
        </div>
      ) : null}

      {/* ---------- J: teaser episode 3 ---------- */}
      {J.visible ? (
        <div style={{ ...J.style, top: TOP + 20 }}>
          <EpisodeTeaser amount={teaserIn} buttonIn={watchBtn}>
            <SeriesBadge episode={3} topic="L'ARBRE DE DÉCISION · L'ENTROPIE" amount={1} />
            <TreeDiagram
              s={{ root: 1, leftLeaf: 1, rightNode: 1, rightLow: 1, rightHigh: 1, path: 0, notes: { root: "H = 0,97", left: "H = 0", right: "H = 0,92", rLow: "H = 0", rHigh: "H = 0" }, notesIn: 1 }}
              width={840}
              height={420}
            />
          </EpisodeTeaser>
        </div>
      ) : null}

      {/* ---------- K: Python ---------- */}
      {K.visible ? (
        <div style={{ ...K.style, gap: 22 }}>
          <CodeRun
            lines={CODE.map((code, i) => ({
              code,
              typeAt: starts[i],
              fpc: 0.4,
              highlight: i === 1 ? { from: at(s16, "base", 0.25) + 12, to: terminalAt, color: COLORS.yellow, badge: "EN BITS" } : undefined,
            }))}
            fileName={FILE_NAME}
            statusText="Python 3.12   SciPy"
            terminal={{ at: terminalAt, command: COMMAND, outputs: OUTPUT.map((text, i) => ({ text, at: outAt[i], color: COLORS.green })) }}
          />
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { text: "50/50 → 1 bit", color: COLORS.blue },
              { text: "90/10 → 0,47", color: COLORS.red },
              { text: "4 égales → 2 bits", color: COLORS.green },
            ].map((c, i) => (
              <div
                key={c.text}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "14px 6px",
                  borderRadius: 16,
                  border: `3px solid ${c.color}`,
                  fontFamily: FONT_UI,
                  fontWeight: 900,
                  fontSize: 28,
                  color: c.color,
                  opacity: Math.min(1, chips[i] * 1.4),
                  transform: `scale(${0.6 + 0.4 * Math.min(1, chips[i])})`,
                }}
              >
                {c.text}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---------- L: recap ---------- */}
      {L.visible ? (
        <div style={{ ...L.style, gap: 18 }}>
          <EntropyGauge value={recapNeedle} amount={recapGauge} width={W} {...UNCERTAINTY} />
          <div style={{ height: 10 }} />
          <TakeawayCard at={recapAt[0]} color={COLORS.yellow} label="INCERTITUDE" detail="C'est ce que l'entropie mesure, en bits" />
          <TakeawayCard at={recapAt[1]} color={COLORS.green} label="0" detail="Tout est prévisible : le groupe est pur" />
          <TakeawayCard at={recapAt[2]} color={COLORS.red} label="MAX" detail="log₂(k) : tout est imprévisible, le chaos" />
        </div>
      ) : null}

      {/* ---------- M: quiz ---------- */}
      {M.visible ? (
        <div style={{ ...M.style, gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
            <EntropyJar passed={0} failed={0} colors={quizColors} ballRadius={17} perRow={10} label="4 COULEURS" h={null} amount={quizJar} balls={ease(at(s18, "sac", 0.1), 40)} valueIn={0} width={460} height={260} />
            {big(<>H = ?</>, COLORS.yellow, quizQ, 90)}
          </div>
          <InfoCard label="LE DÉFI" color={COLORS.yellow} style={{ opacity: Math.min(1, quizJar * 1.4) }}>
            <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 34, color: "white", lineHeight: 1.35 }}>
              Une couleur sort <span style={{ color: PALETTE[0] }}>9 fois sur 10</span>.<br />
              L'entropie est-elle plus grande ou plus petite que <span style={{ color: COLORS.yellow }}>2 bits</span> ?
            </div>
          </InfoCard>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { letter: "A", text: "PLUS GRANDE", color: COLORS.blue, amount: optA },
              { letter: "B", text: "PLUS PETITE", color: ORANGE, amount: optB },
            ].map((o) => (
              <div
                key={o.letter}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 20px",
                  borderRadius: 24,
                  backgroundColor: "rgba(13,17,23,0.88)",
                  border: `5px solid ${o.color}`,
                  opacity: Math.min(1, o.amount * 1.4),
                  transform: `scale(${(0.6 + 0.4 * Math.min(1, o.amount)) * (o.amount >= 1 ? 1 + 0.02 * Math.sin(frame / 7 + (o.letter === "B" ? Math.PI : 0)) : 1)})`,
                }}
              >
                <div style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: o.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_UI, fontWeight: 900, fontSize: 46, color: "#0b0b0b", flexShrink: 0 }}>
                  {o.letter}
                </div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 34, color: "white" }}>{o.text}</div>
              </div>
            ))}
          </div>
          <Pill text="RÉPONDS EN COMMENTAIRE" color={COLORS.yellow} amount={commentPill} />
          <Pill text="ABONNE-TOI" color={COLORS.red} textColor="white" amount={subPill} />
        </div>
      ) : null}
    </EpisodeShell>
  );
};
