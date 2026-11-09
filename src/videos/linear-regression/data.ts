// Dataset and model used throughout the video. Must match
// scripts/video/linear_regression_demo.py (the code shown on screen).

/** Apartment surface (m²). */
export const X = [30, 45, 55, 70, 85, 100];
/** Apartment price (k€). */
export const Y = [140, 215, 200, 290, 300, 390];

export type Line = { a: number; b: number };

/** Ordinary least squares, same result as sklearn's LinearRegression. */
export const fitLeastSquares = (xs: number[], ys: number[]): Line => {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const a = num / den;
  return { a, b: my - a * mx };
};

export const mse = ({ a, b }: Line, xs = X, ys = Y) =>
  xs.reduce((s, x, i) => s + (ys[i] - (a * x + b)) ** 2, 0) / xs.length;

export const BEST_FIT = fitLeastSquares(X, Y); // a ≈ 3.316, b ≈ 43.03
/** Deliberately poor first guess, shown before training. */
export const INITIAL_GUESS: Line = { a: 1.4, b: 150 };

export const PREDICT_X = 75;
export const PREDICT_Y = BEST_FIT.a * PREDICT_X + BEST_FIT.b; // ≈ 291.8

/** French number formatting with a fixed number of decimals ("3,32"). */
export const fr = (n: number, decimals: number) =>
  n.toFixed(decimals).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
