import React from "react";
import { Dot, Plot } from "../../components/Plot";
import { COLORS, FONT_CODE, FONT_UI } from "../../theme";
import { LABELS, levelLine, MAILS, NEW_MAIL, X_MINUS, X_PLUS } from "./data";

const MAIL = COLORS.blue;
const SPAM = COLORS.red;

export type SvmState = {
  pointsIn: number[];
  /** Arbitrary separating lines y = m·x + q shown before the SVM's choice. */
  candidates: { m: number; q: number; amount: number }[];
  /** 0..1 — half-width of the road, in units of the ±1 margin. */
  road: number;
  center: number;
  zones: number;
  svRings: number;
  svLabels: number;
  wArrow: number;
  eqCenter: number;
  eqEdges: number;
  diff: number; // arrow x− → x+
  unitW: number; // w / ||w|| at x−
  widthLabel: { text: string; amount: number } | null;
  newMail: number;
};

export const emptySvm = (n = MAILS.length): SvmState => ({
  pointsIn: Array(n).fill(1),
  candidates: [],
  road: 0,
  center: 0,
  zones: 0,
  svRings: 0,
  svLabels: 0,
  wArrow: 0,
  eqCenter: 0,
  eqEdges: 0,
  diff: 0,
  unitW: 0,
  widthLabel: null,
  newMail: 0,
});

/** Same pixels per unit on both axes so right angles stay right angles. */
export const svmPlotHeight = (width: number) => Math.round(((width - 140) / 7) * 6 + 114);

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color: string; width?: number; amount: number }> = ({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 6,
  amount,
}) => {
  if (amount <= 0) return null;
  const ex = x1 + (x2 - x1) * Math.min(1, amount);
  const ey = y1 + (y2 - y1) * Math.min(1, amount);
  const ang = (Math.atan2(ey - y1, ex - x1) * 180) / Math.PI;
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`0,-${width * 2.2} ${width * 4},0 0,${width * 2.2}`} fill={color} transform={`translate(${ex} ${ey}) rotate(${ang})`} />
    </g>
  );
};

export const SvmPlot: React.FC<{ s: SvmState; width: number }> = ({ s, width }) => {
  const height = svmPlotHeight(width);
  const scale = width / 900;
  return (
    <Plot
      width={width}
      height={height}
      xDomain={[0, 7]}
      yDomain={[0, 6]}
      xTicks={[0, 1, 2, 3, 4, 5, 6, 7]}
      yTicks={[0, 2, 4, 6]}
      xLabel="nombre de liens"
      yLabel="mots en MAJUSCULES"
      children={(sc) => {
        const P = (p: [number, number]) => [sc.sx(p[0]), sc.sy(p[1])] as const;
        const lineAt = (k: number) => levelLine(k).map(P);
        const [e1a, e1b] = lineAt(-s.road);
        const [e2a, e2b] = lineAt(s.road);
        const [ca, cb] = lineAt(0);
        const [xm, ym] = P(X_MINUS);
        const [xp, yp] = P(X_PLUS);
        const [w0x, w0y] = P([4.5, 1.5]);
        const [w1x, w1y] = P([5.5, 2.5]);
        const [u1x, u1y] = P([X_MINUS[0] + Math.SQRT1_2, X_MINUS[1] + Math.SQRT1_2]);
        return (
          <>
            {s.zones > 0 ? (
              <>
                <polygon points={`${sc.left},${sc.bottom} ${sc.left},${ca[1]} ${ca[0]},${ca[1]} ${cb[0]},${cb[1]} ${sc.right},${cb[1]} ${sc.right},${sc.bottom}`} fill={MAIL} opacity={0.0} />
                <polygon points={`${ca[0]},${ca[1]} ${cb[0]},${cb[1]} ${sc.left},${sc.bottom}`} fill={MAIL} opacity={0.12 * s.zones} />
                <polygon points={`${ca[0]},${ca[1]} ${cb[0]},${cb[1]} ${sc.right},${sc.top} ${sc.left},${sc.top}`} fill={SPAM} opacity={0.12 * s.zones} />
                <polygon points={`${cb[0]},${cb[1]} ${sc.right},${sc.bottom} ${sc.right},${sc.top}`} fill={SPAM} opacity={0.12 * s.zones} />
                <polygon points={`${ca[0]},${ca[1]} ${sc.left},${sc.bottom} ${cb[0]},${cb[1]}`} fill={MAIL} opacity={0} />
              </>
            ) : null}
            {s.candidates.map((c, i) =>
              c.amount > 0 ? (
                <line
                  key={i}
                  x1={sc.sx(0)}
                  y1={sc.sy(c.q)}
                  x2={sc.sx(7)}
                  y2={sc.sy(c.m * 7 + c.q)}
                  stroke="#c9d1d9"
                  strokeWidth={4}
                  strokeDasharray="12 10"
                  opacity={Math.min(1, c.amount)}
                />
              ) : null,
            )}
            {s.road > 0 ? (
              <>
                <polygon points={`${e1a[0]},${e1a[1]} ${e1b[0]},${e1b[1]} ${e2b[0]},${e2b[1]} ${e2a[0]},${e2a[1]}`} fill="rgba(90,96,110,0.55)" />
                <line x1={e1a[0]} y1={e1a[1]} x2={e1b[0]} y2={e1b[1]} stroke="white" strokeWidth={4} />
                <line x1={e2a[0]} y1={e2a[1]} x2={e2b[0]} y2={e2b[1]} stroke="white" strokeWidth={4} />
              </>
            ) : null}
            {s.center > 0 ? (
              <line
                x1={ca[0]}
                y1={ca[1]}
                x2={ca[0] + (cb[0] - ca[0]) * Math.min(1, s.center)}
                y2={ca[1] + (cb[1] - ca[1]) * Math.min(1, s.center)}
                stroke={COLORS.yellow}
                strokeWidth={6}
                strokeDasharray={s.road > 0 ? "22 14" : undefined}
              />
            ) : null}
            {MAILS.map(([x, y], i) => (
              <Dot key={i} x={sc.sx(x)} y={sc.sy(y)} r={17 * scale + 4} color={LABELS[i] > 0 ? SPAM : MAIL} amount={s.pointsIn[i] ?? 0} />
            ))}
            {s.svRings > 0 ? (
              <>
                <circle cx={xm} cy={ym} r={34 * scale + 4} fill="none" stroke={COLORS.yellow} strokeWidth={5} opacity={s.svRings} />
                <circle cx={xp} cy={yp} r={34 * scale + 4} fill="none" stroke={COLORS.yellow} strokeWidth={5} opacity={s.svRings} />
              </>
            ) : null}
            <Arrow x1={w0x} y1={w0y} x2={w1x} y2={w1y} color={COLORS.green} amount={s.wArrow} />
            <Arrow x1={xm} y1={ym} x2={xp} y2={yp} color="#ff9f43" amount={s.diff} />
            <Arrow x1={xm} y1={ym} x2={u1x} y2={u1y} color={COLORS.green} width={7} amount={s.unitW} />
            {s.newMail > 0 ? (
              <circle cx={sc.sx(NEW_MAIL[0])} cy={sc.sy(NEW_MAIL[1])} r={22 * Math.min(1.2, s.newMail)} fill={COLORS.yellow} stroke="black" strokeWidth={4} />
            ) : null}
          </>
        );
      }}
      overlay={(sc) => {
        const label = (x: number, y: number, text: React.ReactNode, color: string, amount: number, rotate = 0, size = 30) =>
          amount > 0 ? (
            <div
              style={{
                position: "absolute",
                left: sc.sx(x),
                top: sc.sy(y),
                transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${0.6 + 0.4 * Math.min(1, amount)})`,
                padding: "4px 12px",
                borderRadius: 10,
                backgroundColor: "rgba(0,0,0,0.75)",
                fontFamily: FONT_CODE,
                fontWeight: 700,
                fontSize: size * scale + 4,
                color,
                whiteSpace: "nowrap",
                opacity: Math.min(1, amount * 1.4),
              }}
            >
              {text}
            </div>
          ) : null;
        return (
          <>
            {label(2.85, 1.7, "x₋", COLORS.yellow, s.svLabels, 0, 40)}
            {label(3.15, 4.6, "x₊", COLORS.yellow, s.svLabels, 0, 40)}
            {label(5.75, 2.35, "w", COLORS.green, s.wArrow, 0, 40)}
            {label(0.9, 5.2, "w·x + b = 0", COLORS.yellow, s.eqCenter, 45, 26)}
            {label(0.45, 3.65, "= −1", MAIL, s.eqEdges, 45, 26)}
            {label(2.3, 5.75, "= +1", SPAM, s.eqEdges, 45, 26)}
            {label(3.5, 2.5, "x₊ − x₋", "#ff9f43", s.diff, -45, 26)}
            {label(1.55, 3.2, "w/‖w‖", COLORS.green, s.unitW, 0, 26)}
            {s.widthLabel ? label(4.75, 3.45, s.widthLabel.text, COLORS.yellow, s.widthLabel.amount, 0, 30) : null}
            {s.zones > 0 ? (
              <>
                <div style={{ position: "absolute", left: sc.sx(0.3), top: sc.sy(0.65), fontFamily: FONT_UI, fontWeight: 900, fontSize: 30 * scale + 4, color: MAIL, opacity: s.zones }}>
                  − VRAI MAIL
                </div>
                <div style={{ position: "absolute", right: 40, top: sc.sy(5.75), fontFamily: FONT_UI, fontWeight: 900, fontSize: 30 * scale + 4, color: SPAM, opacity: s.zones }}>
                  + SPAM
                </div>
              </>
            ) : null}
          </>
        );
      }}
    />
  );
};
