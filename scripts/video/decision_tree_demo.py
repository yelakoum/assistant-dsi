# Exact code shown in "ML en 1 minute #3" (src/videos/decision-tree/code.ts).
from sklearn.tree import (
    DecisionTreeClassifier)
X = [[1, 8], [2, 5], [3, 7], [2, 8],
     [5, 4], [7, 4], [5, 7], [6, 8],
     [8, 6], [9, 8]]
y = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
model = DecisionTreeClassifier(
    max_depth=2)
model.fit(X, y)
print(model.predict([[6, 7]]))
print(model.score(X, y))
