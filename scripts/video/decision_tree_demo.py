# Exact code shown in "ML en 1 minute #3" (src/videos/decision-tree/data.ts).
from sklearn import tree
X = [[1, 8], [2, 5], [3, 7], [2, 8],
     [5, 4], [7, 4], [5, 7], [6, 8],
     [8, 6], [9, 8]]
y = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
model = tree.DecisionTreeClassifier(
    criterion="entropy", max_depth=2)
model.fit(X, y)
noms = ["revision", "sommeil"]
print(tree.export_text(
    model, feature_names=noms))
