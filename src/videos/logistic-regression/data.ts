// Data, model and real sklearn output for "ML en 1 minute #1".
// Must match scripts/video/logistic_regression_demo.py.
import { fitLeastSquares } from "../linear-regression/data";

/** Number of links in each email. */
export const LINKS = [0, 1, 1, 2, 3, 4, 5, 6, 8, 9];
/** 1 = spam, 0 = real email. */
export const SPAM = [0, 0, 0, 0, 1, 0, 1, 1, 1, 1];

// Fitted LogisticRegression() (scikit-learn 1.9.1): model.coef_, model.intercept_
export const COEF = 0.91434778;
export const INTERCEPT = -3.29878081;
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-(COEF * x + INTERCEPT)));
/** Where the probability crosses 50 % (≈ 3.6 links). */
export const BOUNDARY = -INTERCEPT / COEF;

/** A straight line fitted on 0/1 labels: shows why it doesn't work. */
export const STRAIGHT = fitLeastSquares(LINKS, SPAM);

export const NEW_LINKS = 7;
export const NEW_PROBA = 0.95696091;

export const FILE_NAME = "spam.py";
export const FIT_CODE = [
  "from sklearn.linear_model import (",
  "    LogisticRegression)",
  "X = [[0], [1], [1], [2], [3],",
  "     [4], [5], [6], [8], [9]]",
  "y = [0, 0, 0, 0, 1, 0, 1, 1, 1, 1]",
  "model = LogisticRegression()",
  "model.fit(X, y)",
];
export const PREDICT_CODE = ["print(model.predict([[7]]))", "print(model.predict_proba([[7]]))"];
export const COMMAND = "python spam.py";
// Real output of `.venv/bin/python scripts/video/logistic_regression_demo.py`.
export const OUTPUT = ["[1]", "[[0.04303909 0.95696091]]"];

/** Small x offsets so identical points don't hide each other. */
export const jitter = (xs: number[], ys: number[], step = 0.25) => {
  const seen = new Map<string, number>();
  return xs.map((x, i) => {
    const key = `${x}:${ys[i]}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return x + n * step;
  });
};
