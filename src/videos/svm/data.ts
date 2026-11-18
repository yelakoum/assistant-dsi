// Data and real sklearn output for the SVM video (scripts/video/svm_demo.py).
// Emails: [number of links, words in CAPITALS]; -1 = real email, +1 = spam.

export const MAILS: [number, number][] = [
  [1, 1], [1, 2], [2, 1], [2, 2],
  [4, 4], [5, 4], [4, 5], [5, 5],
];
export const LABELS = [-1, -1, -1, -1, 1, 1, 1, 1];

// SVC(kernel="linear", C=1000): model.coef_ = [[0.5 0.5]], model.intercept_ = [-3.]
export const W: [number, number] = [0.5, 0.5];
export const B = -3;
export const W_NORM = Math.hypot(W[0], W[1]); // 0.707
export const MARGIN = 2 / W_NORM; // 2.83
export const X_PLUS: [number, number] = [4, 4];
export const X_MINUS: [number, number] = [2, 2];
export const NEW_MAIL: [number, number] = [6, 3]; // w·x + b = 1.5 > 0 → spam

/** Points of the line w·x + b = k, clipped to the chart box. */
export const levelLine = (k: number, xMax = 7, yMax = 6): [[number, number], [number, number]] => {
  // 0.5·x1 + 0.5·x2 − 3 = k  ⇔  x1 + x2 = 6 + 2k
  const c = (k - B) / W[0];
  const x0 = Math.max(0, c - yMax);
  const x1 = Math.min(xMax, c);
  return [
    [x0, c - x0],
    [x1, c - x1],
  ];
};

export const FILE_NAME = "svm.py";
export const TEASER_CODE = ["from sklearn.svm import SVC", 'model = SVC(kernel="linear")', "model.fit(X, y)"];
export const CODE = [
  "from sklearn.svm import SVC",
  "X = [[1, 1], [1, 2], [2, 1], [2, 2],",
  "     [4, 4], [5, 4], [4, 5], [5, 5]]",
  "y = [-1, -1, -1, -1, 1, 1, 1, 1]",
  'model = SVC(kernel="linear", C=1000)',
  "model.fit(X, y)",
  "print(model.coef_, model.intercept_)",
  "print(model.support_vectors_)",
  "print(model.predict([[6, 3]]))",
];
export const COMMAND = "python svm.py";
// Real output of `.venv/bin/python scripts/video/svm_demo.py`.
export const OUTPUT = ["[[0.5 0.5]] [-3.]", "[[2. 2.]", " [4. 4.]]", "[1]"];
