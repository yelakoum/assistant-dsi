import "../../fonts";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeRun, commandDoneAt, scheduleTyping } from "../../components/CodeRun";
import { EpisodeShell, Pill } from "../../components/Episode";
import { InfoCard } from "../../components/InfoCard";
import { TitlePart } from "../../components/SceneTitle";
import { createCues, SfxTrack } from "../../components/Sfx";
import { TakeawayCard } from "../../components/TakeawayCard";
import { episodeTools } from "../../lib/episode";
import { TimedVideoProps } from "../../lib/timing";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { fr } from "../linear-regression/data";
import { ChapterBar, ChapterList, KineticWord } from "../entropy/Visuals";
import { B, CODE, COMMAND, FILE_NAME, MAILS, MARGIN, OUTPUT, TEASER_CODE, W, W_NORM } from "./data";
import { emptySvm, SvmPlot, svmPlotHeight, SvmState } from "./SvmPlot";

export const SVM_ID = "svm";

const W_PX = 900;
const TOP = 236;
const ORANGE = "#ff9f43";
const CHAPTERS = ["L'IDÉE", "LA MARGE", "LE CALCUL", "L'OPTIMISATION"];

const TITLES: TitlePart[][] = [
  [],
  [{ text: "Le code " }, { text: "en 3 lignes", color: COLORS.yellow }],
  [{ text: "Le " }, { text: "plan", color: COLORS.yellow }],
  [{ text: "Les " }, { text: "données", color: COLORS.blue }],
  [{ text: "Quelle " }, { text: "frontière ?", color: COLORS.yellow }],
  [{ text: "La route " }, { text: "la plus large", color: COLORS.yellow }],
  [{ text: "Vecteurs " }, { text: "de support", color: COLORS.yellow }],
  [{ text: "La " }, { text: "frontière", color: COLORS.yellow }],
  [{ text: "Classer " }, { text: "un mail", color: COLORS.blue }],
  [{ text: "Les bords " }, { text: "à ±1", color: COLORS.yellow }],
  [{ text: "Quelle " }, { text: "largeur ?", color: ORANGE }],
  [{ text: "La " }, { text: "projection", color: COLORS.green }],
  [{ text: "On " }, { text: "soustrait", color: COLORS.yellow }],
  [{ text: "La formule " }, { text: "clé", color: COLORS.yellow }],
  [{ text: "L'" }, { text: "optimisation", color: COLORS.green }],
  [{ text: "Notre " }, { text: "exemple", color: COLORS.blue }],
  [{ text: "Le code " }, { text: "complet", color: COLORS.yellow }],
  [{ text: "À " }, { text: "retenir", color: COLORS.yellow }],
  [{ text: "Ton " }, { text: "défi", color: COLORS.yellow }],
];

export const SvmVideo: React.FC<TimedVideoProps> = ({ showTikTokOverlay, watermark, timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!timing) return <AbsoluteFill style={{ backgroundColor: "black" }} />;

  const { seg, at, pop: popRaw, ease, fadeOut, scene } = episodeTools(frame, timing, durationInFrames, 19);
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19] = seg;
  const { events, cue } = createCues();
  const pop = (start: number, volume?: number) => popRaw(cue(start, "pop", { volume }));
  const ding = (start: number) => popRaw(cue(start, "ding"));
  seg.forEach((w, i) => i > 0 && cue(w.start, "whoosh"));
  const sc = (start: number, end: number) => scene(start, end, TOP);

  // ---- Chapter bar ---------------------------------------------------------
  const segIndex = seg.reduce((acc, w, i) => (frame >= w.start ? i : acc), 0);
  const chapterOf = (i: number) => (i >= 3 && i <= 6 ? 0 : i >= 7 && i <= 10 ? 1 : i >= 11 && i <= 13 ? 2 : i >= 14 && i <= 15 ? 3 : -1);
  const active = chapterOf(segIndex);
  const done = segIndex >= 16 ? 4 : active === -1 ? 0 : active;

  // ======================= A: intro (1) ======================================
  const A = scene(s1.start, s2.start, 30);
  const askPill = pop(s1.start + 4);
  const previewIn = ease(s1.start + 20, 30);
  const previewRoad = ease(s1.start + 60, 40);
  const todayIn = pop(at(s1, "aujourdhui", 0.45));
  const svmAt = at(s1, "svm", 0.75);
  "SVM".split("").forEach((_, i) => cue(svmAt + i * 6, "pop", { volume: 0.5 }));
  const fullName = ding(at(s1, "machine", 0.83, 2));
  const preview: SvmState = { ...emptySvm(), pointsIn: MAILS.map((_, i) => popRaw(s1.start + 20 + i * 4)), road: previewRoad, center: previewRoad, svRings: ease(s1.start + 100) };

  // ======================= B: code teaser (2) ================================
  const Bs = sc(s2.start, s3.start);
  const teaserStarts = scheduleTyping(TEASER_CODE, at(s2, "importe", 0.2), 0.5, { 1: at(s2, "cree", 0.3), 2: at(s2, "fit", 0.45) });
  TEASER_CODE.forEach((c, i) => cue(teaserStarts[i], "typing", { duration: c.length * 0.5 }));
  const insideQ = pop(at(s2, "passetil", 0.62));
  const discover = ding(at(s2, "decouvrir", 0.9));

  // ======================= C: plan (3) =======================================
  const Cs = sc(s3.start, s4.start);
  const planIns = [pop(at(s3, "idee", 0.2)), pop(at(s3, "marge", 0.35)), pop(at(s3, "calcul", 0.5)), pop(at(s3, "optimisation", 0.8))];

  // ======================= D: the idea + the margin (4-12) ===================
  const D = sc(s4.start, s13.start);
  const roadIn = ease(at(s6, "route", 0.65), 45);
  const plotD: SvmState = {
    ...emptySvm(),
    pointsIn: MAILS.map((_, i) => popRaw(cue(s4.start + 10 + i * 5, "tick", { volume: 0.25 }))),
    candidates: [
      { m: -0.5, q: 4.2, amount: ease(at(s5, "infinite", 0.25), 15) * fadeOut(s6.start + 20) },
      { m: -2, q: 8.6, amount: ease(cue(at(s5, "celleci", 0.5), "whoosh", { volume: 0.25 }), 15) * fadeOut(s6.start + 20) },
      { m: -0.25, q: 3.5, amount: ease(cue(at(s5, "cellela", 0.65), "whoosh", { volume: 0.25 }), 15) * fadeOut(s6.start + 20) },
    ],
    road: roadIn,
    center: ease(at(s6, "droite", 0.25), 25),
    zones: ease(at(s9, "signe", 0.25)) * fadeOut(s10.start + 10),
    svRings: pop(at(s7, "vecteurs", 0.2)),
    svLabels: pop(at(s7, "plus", 0.88)),
    wArrow: ease(cue(at(s8, "w", 0.55, 2), "pop"), 20),
    eqCenter: pop(at(s8, "egale", 0.4)),
    eqEdges: pop(at(s10, "plus", 0.2)),
    diff: ease(cue(at(s11, "distance", 0.5), "whoosh", { volume: 0.25 }), 25),
    unitW: ease(cue(at(s12, "direction", 0.38), "pop"), 20),
    widthLabel: { text: "largeur ?", amount: pop(at(s11, "largeur", 0.25)) },
    newMail: 0,
  };
  // Bottom card, one per segment.
  const cardFor = (w: typeof s4, delay = 10) => pop(w.start + delay);
  const legendIn = cardFor(s4, 30);
  const howIn = pop(at(s5, "laquelle", 0.8));
  const roadCard = ding(at(s6, "route", 0.65));
  const svCard = pop(at(s7, "seuls", 0.55));
  const eqCard = pop(at(s8, "equation", 0.1));
  const perpNote = pop(at(s8, "perpendiculaire", 0.7));
  const signRows = [pop(at(s9, "positif", 0.4)), pop(at(s9, "negatif", 0.72))];
  const edgeRows = [pop(at(s10, "egale", 0.6)), pop(at(s10, "egale", 0.9, 2))];
  const widthQ = pop(at(s11, "largeur", 0.25));
  const projCard = ding(at(s12, "norme", 0.85));

  // ======================= E: derivation board (13-15) =======================
  const E = sc(s13.start, s16.start);
  const eqPlus = pop(s13.start + 8);
  const eqMinus = pop(s13.start + 18);
  const minusSign = pop(at(s13, "soustrait", 0.1));
  const strikeB = ease(cue(at(s13, "b", 0.3), "tick"), 15);
  const diffResult = ding(at(s13, "deux", 0.9));
  const widthLine = pop(at(s14, "largeur", 0.1));
  const keyFormula = ding(at(s14, "norme", 0.4));
  const keyLabel = pop(at(s14, "cle", 0.75));
  const optim = pop(at(s15, "petite", 0.35));
  const constraint = ding(at(s15, "superieur", 0.85));

  // ======================= F: numbers (16) ===================================
  const F = sc(s16.start, s17.start);
  const numW = pop(at(s16, "cinq", 0.25, 2));
  const numB = pop(at(s16, "trois", 0.35));
  const numNorm = pop(at(s16, "onze", 0.6));
  const numMargin = ding(at(s16, "quatrevingttrois", 0.7));
  const numCheck = ding(at(s16, "distance", 0.85));
  const plotF: SvmState = {
    ...emptySvm(),
    road: 1,
    center: 1,
    svRings: 1,
    svLabels: 1,
    eqCenter: 0,
    diff: ease(at(s16, "marge", 0.45), 25),
    widthLabel: { text: `${fr(MARGIN, 2)}`, amount: pop(at(s16, "quatrevingttrois", 0.7)) },
  };

  // ======================= G: full code (17) =================================
  const G = sc(s17.start, s18.start);
  const starts = scheduleTyping(CODE, s17.start + 10, 0.28, { 4: at(s17, "lineaire", 0.15) - 6 });
  const typingEnd = starts[8] + CODE[8].length * 0.28;
  cue(starts[0], "typing", { duration: typingEnd - starts[0] });
  const terminalAt = typingEnd + 8;
  const cmdDone = commandDoneAt(terminalAt, COMMAND);
  cue(terminalAt + 6, "typing", { duration: cmdDone - terminalAt - 6 });
  const outAt = [
    Math.max(cmdDone + 6, at(s17, "coef", 0.3)),
    Math.max(cmdDone + 12, at(s17, "support", 0.5)),
    Math.max(cmdDone + 16, at(s17, "support", 0.5) + 5),
    Math.max(cmdDone + 22, at(s17, "spam", 0.9)),
  ];
  outAt.forEach((o) => cue(o, "tick"));
  ding(outAt[3] + 6);

  // ======================= H: recap (18) =====================================
  const H = sc(s18.start, s19.start);
  const recapAt = [cue(at(s18, "marge", 0.3), "pop"), cue(at(s18, "seuls", 0.5), "pop"), cue(at(s18, "norme", 0.85), "pop")];

  // ======================= I: kernel teaser + quiz (19) ======================
  const I = sc(s19.start, durationInFrames + 100);
  const ringsIn = pop(s19.start + 10);
  const kernelPill = ding(at(s19, "kernel", 0.25));
  const quizIn = pop(at(s19, "defi", 0.5));
  const options = [
    { letter: "A", text: "ELLE DOUBLE", color: COLORS.blue, in: pop(at(s19, "devient", 0.66)) },
    { letter: "B", text: "÷ 2", color: ORANGE, in: pop(at(s19, "devient", 0.66) + 8) },
    { letter: "C", text: "PAREIL", color: COLORS.green, in: pop(at(s19, "devient", 0.66) + 16) },
  ];
  const commentPill = pop(at(s19, "commentaire", 0.85));
  const subPill = pop(at(s19, "abonnetoi", 0.92));

  // ---------------------------------------------------------------------------
  const plotH = svmPlotHeight(W_PX);
  const formula = (content: React.ReactNode, amount: number, size = 48, color = "white") => (
    <div
      style={{
        fontFamily: FONT_CODE,
        fontWeight: 700,
        fontSize: size,
        color,
        textAlign: "center",
        whiteSpace: "nowrap",
        opacity: Math.min(1, amount * 1.4),
        transform: `translateY(${(1 - Math.min(1, amount)) * 24}px)`,
      }}
    >
      {content}
    </div>
  );
  const bigText = (text: React.ReactNode, color: string, amount: number, size = 40) => (
    <div
      style={{
        textAlign: "center",
        fontFamily: FONT_UI,
        fontWeight: 900,
        fontSize: size,
        color,
        opacity: Math.min(1, amount * 1.4),
        transform: `scale(${0.6 + 0.4 * Math.min(1, amount)})`,
      }}
    >
      {text}
    </div>
  );
  const pick = <T,>(list: [number, T][]) => {
    let out: T | null = null;
    list.forEach(([start, v]) => {
      if (frame >= start) out = v;
    });
    return out as T | null;
  };
  // Which card sits under the big plot.
  const bottomCard = pick<React.ReactNode>([
    [
      s4.start,
      <InfoCard key="legend" label="LES DONNÉES" color={COLORS.blue} style={{ opacity: Math.min(1, legendIn * 1.4) }}>
        <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: 32, color: "#e6edf3" }}>
          <span style={{ color: COLORS.blue }}>● y = −1 vrai mail</span> &nbsp; <span style={{ color: COLORS.red }}>● y = +1 spam</span>
        </div>
      </InfoCard>,
    ],
    [s5.start, bigText(<>∞ DROITES POSSIBLES… <span style={{ color: COLORS.yellow }}>LAQUELLE ?</span></>, "white", howIn, 42)],
    [s6.start, bigText(<>MARGE MAXIMALE = <span style={{ color: COLORS.yellow }}>ROUTE LA PLUS LARGE</span></>, "white", roadCard, 38)],
    [s7.start, bigText(<>SEULS <span style={{ color: COLORS.yellow }}>x₊ ET x₋</span> FIXENT LA FRONTIÈRE</>, "white", svCard, 38)],
    [
      s8.start,
      <InfoCard key="eq" label="LA FRONTIÈRE" color={COLORS.yellow} style={{ opacity: Math.min(1, eqCard * 1.4) }}>
        {formula("w · x + b = 0", eqCard, 50, COLORS.yellow)}
        <div style={{ textAlign: "center", fontFamily: FONT_UI, fontWeight: 800, fontSize: 28, color: COLORS.green, opacity: perpNote }}>w ⟂ frontière · b la décale</div>
      </InfoCard>,
    ],
    [
      s9.start,
      <InfoCard key="sign" label="CLASSER = REGARDER LE SIGNE" color={COLORS.blue}>
        {formula(<>w·x + b &gt; 0 → <span style={{ color: COLORS.red }}>SPAM</span></>, signRows[0], 40)}
        {formula(<>w·x + b &lt; 0 → <span style={{ color: COLORS.blue }}>VRAI MAIL</span></>, signRows[1], 40)}
      </InfoCard>,
    ],
    [
      s10.start,
      <InfoCard key="edges" label="LES DEUX BORDS" color={COLORS.yellow}>
        {formula(<>w·x₊ + b = <span style={{ color: COLORS.red }}>+1</span></>, edgeRows[0], 44)}
        {formula(<>w·x₋ + b = <span style={{ color: COLORS.blue }}>−1</span></>, edgeRows[1], 44)}
      </InfoCard>,
    ],
    [s11.start, bigText(<>LARGEUR = DISTANCE ENTRE <span style={{ color: ORANGE }}>x₊ ET x₋</span>, ⟂ À LA FRONTIÈRE</>, "white", widthQ, 34)],
    [
      s12.start,
      <InfoCard key="proj" label="PROJECTION SUR w / ‖w‖" color={COLORS.green} style={{ opacity: Math.min(1, ease(s12.start + 10) * 1.4) }}>
        {formula(
          <>
            largeur = <span style={{ color: ORANGE }}>(x₊ − x₋)</span> · <span style={{ color: COLORS.green }}>w/‖w‖</span>
          </>,
          projCard > 0 ? 1 : ease(s12.start + 10),
          42,
        )}
      </InfoCard>,
    ],
  ]);

  return (
    <EpisodeShell timing={timing} seg={seg} titles={TITLES} durationInFrames={durationInFrames} showTikTokOverlay={showTikTokOverlay} watermark={watermark}>
      <SfxTrack events={events} />

      {frame >= s3.start ? (
        <div style={{ position: "absolute", top: 158, left: 0, right: 0 }}>
          <ChapterBar chapters={CHAPTERS} active={active} done={done} progress={frame / durationInFrames} amount={ease(s3.start, 20)} />
        </div>
      ) : null}

      {/* ---------- A: intro ---------- */}
      {A.visible ? (
        <div style={{ ...A.style, gap: 22, alignItems: "center" }}>
          <Pill text="TU VEUX APPRENDRE LE MACHINE LEARNING ?" color={COLORS.yellow} amount={askPill} fontSize={36} />
          <div style={{ opacity: previewIn, transform: `scale(${0.9 + 0.1 * previewIn})` }}>
            <SvmPlot s={preview} width={720} />
          </div>
          {bigText("AUJOURD'HUI, ON APPREND :", "#c9d1d9", todayIn, 40)}
          {frame >= svmAt - 2 ? <KineticWord text="SVM" at={svmAt} stagger={6} size={150} color={COLORS.yellow} /> : <div style={{ height: 180 }} />}
          {bigText("LA MACHINE À VECTEURS DE SUPPORT", "white", fullName, 40)}
        </div>
      ) : null}

      {/* ---------- B: code teaser ---------- */}
      {Bs.visible ? (
        <div style={{ ...Bs.style, gap: 40, top: TOP + 60 }}>
          <CodeRun lines={TEASER_CODE.map((code, i) => ({ code, typeAt: teaserStarts[i], fpc: 0.5 }))} fileName={FILE_NAME} fontSize={36} lineHeight={60} />
          {bigText("?", COLORS.yellow, insideQ, 160)}
          {bigText("QUE SE PASSE-T-IL À L'INTÉRIEUR ?", "white", insideQ, 44)}
          <Pill text="ON VA LE DÉCOUVRIR, PAS À PAS" color={COLORS.yellow} amount={discover} />
        </div>
      ) : null}

      {/* ---------- C: plan ---------- */}
      {Cs.visible ? (
        <div style={{ ...Cs.style, top: TOP + 40 }}>
          <ChapterList
            ins={planIns}
            items={[
              { title: "L'IDÉE", detail: "La route la plus large", icon: "↔" },
              { title: "LA MARGE", detail: "w·x + b = ±1", icon: "±" },
              { title: "LE CALCUL", detail: "La distance entre x₊ et x₋", icon: "d" },
              { title: "L'OPTIMISATION", detail: "Minimiser ‖w‖", icon: "↓" },
            ]}
          />
        </div>
      ) : null}

      {/* ---------- D: idea + margin ---------- */}
      {D.visible ? (
        <div style={{ ...D.style, gap: 18 }}>
          <SvmPlot s={plotD} width={W_PX} />
          <div style={{ minHeight: 1180 - TOP - plotH }}>{bottomCard}</div>
        </div>
      ) : null}

      {/* ---------- E: derivation board ---------- */}
      {E.visible ? (
        <div style={{ ...E.style, gap: 16 }}>
          <InfoCard label="ON SOUSTRAIT LES DEUX BORDS" color={COLORS.yellow}>
            {formula(
              <>
                w·x₊ + <span style={{ textDecoration: strikeB > 0.5 ? "line-through" : undefined, color: strikeB > 0.5 ? COLORS.gutter : "white" }}>b</span> = +1
              </>,
              eqPlus,
              46,
            )}
            {formula(
              <>
                <span style={{ color: COLORS.red, opacity: minusSign }}>− </span>(w·x₋ + <span style={{ textDecoration: strikeB > 0.5 ? "line-through" : undefined, color: strikeB > 0.5 ? COLORS.gutter : "white" }}>b</span>) = −1
              </>,
              eqMinus,
              46,
            )}
            <div style={{ height: 4, margin: "10px 60px", backgroundColor: "rgba(255,255,255,0.4)", opacity: minusSign }} />
            {formula(
              <>
                w · <span style={{ color: ORANGE }}>(x₊ − x₋)</span> = <span style={{ color: COLORS.yellow }}>2</span>
              </>,
              diffResult,
              52,
            )}
          </InfoCard>
          {frame >= s14.start ? (
            <InfoCard label="DONC" color={COLORS.green} style={{ opacity: Math.min(1, widthLine * 1.4) }}>
              {formula(
                <>
                  largeur = <span style={{ color: ORANGE }}>(x₊ − x₋)</span>·w / ‖w‖
                </>,
                widthLine,
                38,
              )}
              <div
                style={{
                  margin: "14px auto 0",
                  padding: "10px 26px",
                  width: "fit-content",
                  borderRadius: 20,
                  border: `5px solid ${COLORS.yellow}`,
                  boxShadow: `0 0 ${40 * Math.min(1, keyFormula)}px rgba(255,230,0,0.4)`,
                  opacity: Math.min(1, keyFormula * 1.4),
                  transform: `scale(${0.6 + 0.4 * Math.min(1, keyFormula)})`,
                }}
              >
                {formula(
                  <>
                    marge = <span style={{ color: COLORS.yellow }}>2 / ‖w‖</span>
                  </>,
                  1,
                  70,
                )}
              </div>
              {bigText("LA FORMULE CLÉ DU SVM", COLORS.yellow, keyLabel, 32)}
            </InfoCard>
          ) : null}
          {frame >= s15.start ? (
            <InfoCard label="L'OPTIMISATION" color={COLORS.blue} style={{ opacity: Math.min(1, optim * 1.4) }}>
              {formula(
                <>
                  max 2/‖w‖ ⇔ <span style={{ color: COLORS.green }}>min ½‖w‖²</span>
                </>,
                optim,
                42,
              )}
              {formula(
                <>
                  sous : <span style={{ color: COLORS.yellow }}>yᵢ (w·xᵢ + b) ≥ 1</span>
                </>,
                constraint,
                40,
              )}
            </InfoCard>
          ) : null}
        </div>
      ) : null}

      {/* ---------- F: our numbers ---------- */}
      {F.visible ? (
        <div style={{ ...F.style, gap: 16 }}>
          <SvmPlot s={plotF} width={W_PX} />
          <InfoCard label="NOTRE EXEMPLE (sklearn)" color={COLORS.blue}>
            {formula(
              <>
                w = ({fr(W[0], 1)} ; {fr(W[1], 1)}) &nbsp; b = {fr(B, 0)}
              </>,
              Math.max(numW, numB),
              38,
            )}
            {formula(
              <>
                marge = 2 / {fr(W_NORM, 2)} = <span style={{ color: COLORS.yellow }}>{fr(MARGIN, 2)}</span>
              </>,
              numMargin > 0 ? numMargin : numNorm * 0.6,
              38,
            )}
            {formula(<span style={{ color: COLORS.green }}>= distance(x₊, x₋) ✓</span>, numCheck, 36)}
          </InfoCard>
        </div>
      ) : null}

      {/* ---------- G: full code ---------- */}
      {G.visible ? (
        <div style={{ ...G.style, gap: 18 }}>
          <CodeRun
            lines={CODE.map((code, i) => ({
              code,
              typeAt: starts[i],
              fpc: 0.28,
              highlight: i === 4 ? { from: at(s17, "lineaire", 0.15), to: terminalAt, color: COLORS.yellow, badge: "LINÉAIRE" } : undefined,
            }))}
            fileName={FILE_NAME}
            fontSize={30}
            lineHeight={46}
            terminal={{
              at: terminalAt,
              command: COMMAND,
              outputs: OUTPUT.map((text, i) => ({ text, at: outAt[i], color: i === 3 ? COLORS.red : COLORS.green })),
            }}
          />
        </div>
      ) : null}

      {/* ---------- H: recap ---------- */}
      {H.visible ? (
        <div style={{ ...H.style, gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SvmPlot s={{ ...emptySvm(), road: 1, center: 1, svRings: 1, svLabels: 1 }} width={640} />
          </div>
          <TakeawayCard at={recapAt[0]} color={COLORS.yellow} label="MARGE MAX" detail="La route la plus large possible" />
          <TakeawayCard at={recapAt[1]} color={COLORS.blue} label="SUPPORT" detail="Seuls x₊ et x₋ comptent" />
          <TakeawayCard at={recapAt[2]} color={COLORS.green} label="2 / ‖w‖" detail="La largeur de la marge" />
        </div>
      ) : null}

      {/* ---------- I: kernel teaser + quiz ---------- */}
      {I.visible ? (
        <div style={{ ...I.style, gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: Math.min(1, ringsIn * 1.4) }}>
            <svg width={300} height={300}>
              <rect x={2} y={2} width={296} height={296} rx={24} fill="rgba(13,17,23,0.85)" stroke="rgba(255,255,255,0.15)" />
              {Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <circle key={`in${i}`} cx={150 + 45 * Math.cos(a)} cy={150 + 45 * Math.sin(a)} r={12} fill={COLORS.blue} stroke="white" strokeWidth={2} />;
              })}
              {Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                return <circle key={`out${i}`} cx={150 + 115 * Math.cos(a)} cy={150 + 115 * Math.sin(a)} r={12} fill={COLORS.red} stroke="white" strokeWidth={2} />;
              })}
            </svg>
            <div style={{ flex: 1 }}>
              {bigText("UNE DROITE NE SUFFIT PAS…", "white", ringsIn, 34)}
              <div style={{ height: 14 }} />
              <Pill text="PROCHAINE VIDÉO : KERNEL TRICK" color={COLORS.yellow} amount={kernelPill} fontSize={30} />
            </div>
          </div>
          <InfoCard label="LE DÉFI" color={COLORS.yellow} style={{ opacity: Math.min(1, quizIn * 1.4) }}>
            <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 40, color: "white", textAlign: "center" }}>
              Si on <span style={{ color: COLORS.yellow }}>double w</span>, la marge… ?
            </div>
          </InfoCard>
          <div style={{ display: "flex", gap: 14 }}>
            {options.map((o) => (
              <div
                key={o.letter}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 14px",
                  borderRadius: 22,
                  backgroundColor: "rgba(13,17,23,0.88)",
                  border: `5px solid ${o.color}`,
                  opacity: Math.min(1, o.in * 1.4),
                  transform: `scale(${0.6 + 0.4 * Math.min(1, o.in)})`,
                }}
              >
                <div style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: o.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_UI, fontWeight: 900, fontSize: 38, color: "#0b0b0b", flexShrink: 0 }}>
                  {o.letter}
                </div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 30, color: "white" }}>{o.text}</div>
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
