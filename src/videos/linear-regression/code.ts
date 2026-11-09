// Code shown in the editor — identical to scripts/video/linear_regression_demo.py.
export const FILE_NAME = "regression.py";

export const FIT_CODE = [
  "from sklearn.linear_model import (",
  "    LinearRegression)",
  "X = [[30], [45], [55],",
  "     [70], [85], [100]]",
  "y = [140, 215, 200, 290, 300, 390]",
  "model = LinearRegression()",
  "model.fit(X, y)",
];

export const PREDICT_CODE = [
  "print(model.coef_, model.intercept_)",
  "print(model.predict([[75]]))",
  "print(model.score(X, y))",
];

export const TERMINAL_COMMAND = "python regression.py";

// Real output of `.venv/bin/python scripts/video/linear_regression_demo.py`
// (scikit-learn 1.9.1, numpy 2.5.4).
export const TERMINAL_OUTPUT = [
  "[3.31644005] 43.02843016069224",
  "[291.76143387]",
  "0.9428853081124936",
];

export const R2 = 0.9428853081124936;
