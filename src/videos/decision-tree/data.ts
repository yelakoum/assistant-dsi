// Data and real sklearn output for "ML en 1 minute #3" (scripts/video/decision_tree_demo.py).

/** [hours of revision, hours of sleep] */
export const STUDENTS: [number, number][] = [
  [1, 8], [2, 5], [3, 7], [2, 8], [5, 4],
  [7, 4], [5, 7], [6, 8], [8, 6], [9, 8],
];
/** 1 = passed the exam, 0 = failed. */
export const PASSED = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];

// export_text(model) with DecisionTreeClassifier(max_depth=2):
//   revision <= 4.00 -> 0 ; else sommeil <= 5.00 -> 0 ; else -> 1
export const SPLIT_REVISION = 4;
export const SPLIT_SLEEP = 5;

export const NEW_STUDENT: [number, number] = [6, 7];

export const FILE_NAME = "examen.py";
export const FIT_CODE = [
  "from sklearn.tree import (",
  "    DecisionTreeClassifier)",
  "X = [[1, 8], [2, 5], [3, 7], [2, 8],",
  "     [5, 4], [7, 4], [5, 7], [6, 8],",
  "     [8, 6], [9, 8]]",
  "y = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]",
  "model = DecisionTreeClassifier(",
  "    max_depth=2)",
  "model.fit(X, y)",
];
export const PREDICT_CODE = ["print(model.predict([[6, 7]]))", "print(model.score(X, y))"];
export const COMMAND = "python examen.py";
// Real output of `.venv/bin/python scripts/video/decision_tree_demo.py`.
export const OUTPUT = ["[1]", "1.0"];
