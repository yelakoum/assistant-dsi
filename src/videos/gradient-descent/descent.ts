// Real gradient descent on the apartment data from the previous video.
// To keep it easy to picture, only the slope `a` (price per m²) is learned;
// the starting price `b` is fixed at its best value.
import { BEST_FIT, X, Y } from "../linear-regression/data";

export const B = BEST_FIT.b; // ≈ 43.03 k€
export const BEST_A = BEST_FIT.a; // ≈ 3.316 k€ per m²
/** The machine's first (bad) guess for the price per m². */
export const GUESS_A = 1.0;

/** Error score (mean squared error) for a given price per m². */
export const cost = (a: number) => X.reduce((s, x, i) => s + (Y[i] - (a * x + B)) ** 2, 0) / X.length;
/** Slope of the valley under the hiker's feet (d cost / d a). */
export const gradient = (a: number) => (2 / X.length) * X.reduce((s, x, i) => s + (a * x + B - Y[i]) * x, 0);

/** Curvature of the valley (constant for a parabola). */
const CURVATURE = (2 / X.length) * X.reduce((s, x) => s + x * x, 0);
/** Step sizes (learning rates): each step closes 45 % of the gap… */
export const LEARNING_RATE_GOOD = 0.45 / CURVATURE;
/** …or overshoots so much that every step lands further away. */
export const LEARNING_RATE_TOO_BIG = 2.3 / CURVATURE;

export const descend = (start: number, learningRate: number, steps: number) => {
  const path = [start];
  for (let i = 0; i < steps; i++) {
    const a = path[path.length - 1];
    path.push(a - learningRate * gradient(a));
  }
  return path;
};

/** 1.00 → 2.04 → 2.61 → … → 3.30 (score 25 482 → 379). */
export const GOOD_PATH = descend(GUESS_A, LEARNING_RATE_GOOD, 8);
/** 2.30 → 4.64 → 1.60 → 5.55 → 0.41 → 7.09 → -1.59 (score explodes). */
export const BAD_PATH = descend(2.3, LEARNING_RATE_TOO_BIG, 6);
