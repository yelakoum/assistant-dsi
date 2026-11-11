# Exact code shown in "ML en 1 minute #1" (src/videos/logistic-regression/code.ts).
from sklearn.linear_model import (
    LogisticRegression)
X = [[0], [1], [1], [2], [3],
     [4], [5], [6], [8], [9]]
y = [0, 0, 0, 0, 1, 0, 1, 1, 1, 1]
model = LogisticRegression()
model.fit(X, y)
print(model.predict([[7]]))
print(model.predict_proba([[7]]))
