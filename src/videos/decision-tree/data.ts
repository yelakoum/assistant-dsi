// Data, entropy maths and real sklearn output for "ML en 1 minute #3"
// (scripts/video/decision_tree_demo.py, criterion="entropy").

/** [hours of revision, hours of sleep] */
export const STUDENTS: [number, number][] = [
  [1, 8], [2, 5], [3, 7], [2, 8], [5, 4],
  [7, 4], [5, 7], [6, 8], [8, 6], [9, 8],
];
/** 1 = passed the exam, 0 = failed. */
export const PASSED = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];

/** Shannon entropy (bits) of a group of 0/1 labels. */
export const entropy = (labels: number[]) => {
  const n = labels.length;
  if (n === 0) return 0;
  const p1 = labels.filter((l) => l === 1).length / n;
  return [p1, 1 - p1].reduce((h, p) => (p > 0 ? h - p * Math.log2(p) : h), 0);
};

/** Splits the class on `feature > threshold` and returns both groups' entropy and the information gain. */
export const evaluateSplit = (feature: 0 | 1, threshold: number, idx = STUDENTS.map((_, i) => i)) => {
  const low = idx.filter((i) => STUDENTS[i][feature] <= threshold).map((i) => PASSED[i]);
  const high = idx.filter((i) => STUDENTS[i][feature] > threshold).map((i) => PASSED[i]);
  const all = idx.map((i) => PASSED[i]);
  const n = all.length;
  const after = (low.length / n) * entropy(low) + (high.length / n) * entropy(high);
  return {
    before: entropy(all),
    low: { n: low.length, passed: low.filter(Boolean).length, h: entropy(low) },
    high: { n: high.length, passed: high.filter(Boolean).length, h: entropy(high) },
    after,
    gain: entropy(all) - after,
  };
};

export const ROOT_ENTROPY = entropy(PASSED); // 0.971
/** Question 1 tested at the root: "révisé plus de 4 h ?" → after 0.551, gain 0.420 (best of all). */
export const Q_REVISION = evaluateSplit(0, 4);
/** Question 2 tested at the root: "dormi plus de 5 h ?" → after 0.690, gain 0.281. */
export const Q_SLEEP = evaluateSplit(1, 5.5);
/** Second level, on the students who revised > 4 h: sleep makes both groups pure. */
export const Q_SLEEP_LEVEL2 = evaluateSplit(
  1,
  5,
  STUDENTS.map((_, i) => i).filter((i) => STUDENTS[i][0] > 4),
);

export const SPLIT_REVISION = 4;
export const SPLIT_SLEEP = 5.5; // "plus de 5 h" (between 5 h and 6 h)

export const FILE_NAME = "examen.py";
export const FIT_CODE = [
  "from sklearn import tree",
  "X = [[1, 8], [2, 5], [3, 7], [2, 8],",
  "     [5, 4], [7, 4], [5, 7], [6, 8],",
  "     [8, 6], [9, 8]]",
  "y = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]",
  "model = tree.DecisionTreeClassifier(",
  '    criterion="entropy", max_depth=2)',
  "model.fit(X, y)",
  'noms = ["revision", "sommeil"]',
  "print(tree.export_text(",
  "    model, feature_names=noms))",
];
export const COMMAND = "python examen.py";
// Real output of `.venv/bin/python scripts/video/decision_tree_demo.py`.
export const OUTPUT = [
  "|--- revision <= 4.00",
  "|   |--- class: 0",
  "|--- revision >  4.00",
  "|   |--- sommeil <= 5.00",
  "|   |   |--- class: 0",
  "|   |--- sommeil >  5.00",
  "|   |   |--- class: 1",
];
