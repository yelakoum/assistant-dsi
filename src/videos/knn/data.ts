// Data and real sklearn output for "ML en 1 minute #2" (scripts/video/knn_demo.py).
// Dogs are placed so the 3 neighbours that *look* closest on the chart are also
// the real nearest neighbours (the axes don't share a scale: kg vs cm).

/** [weight kg, height cm] */
export const ANIMALS: [number, number][] = [
  [3, 22], [3, 24], [4, 25], [5, 27],
  [7, 31], [8, 37], [9, 42], [11, 46],
];
export const LABELS = ["chat", "chat", "chat", "chat", "chien", "chien", "chien", "chien"] as const;

export const NEW_ANIMAL: [number, number] = [6, 28];
/** model.kneighbors([[6, 28]]): indices and distances, nearest first. */
export const NEIGHBORS = [3, 4, 2];
export const NEIGHBOR_DISTANCES = [1.41421356, 3.16227766, 3.60555128];

export const FILE_NAME = "chat_chien.py";
export const FIT_CODE = [
  "from sklearn.neighbors import (",
  "    KNeighborsClassifier)",
  "X = [[3, 22], [3, 24], [4, 25],",
  "     [5, 27], [7, 31], [8, 37],",
  "     [9, 42], [11, 46]]",
  'y = ["chat"] * 4 + ["chien"] * 4',
  "model = KNeighborsClassifier(3)",
  "model.fit(X, y)",
];
export const PREDICT_CODE = ["print(model.predict([[6, 28]]))", "print(model.predict_proba([[6, 28]]))"];
export const COMMAND = "python chat_chien.py";
// Real output of `.venv/bin/python scripts/video/knn_demo.py`.
export const OUTPUT = ["['chat']", "[[0.66666667 0.33333333]]"];
