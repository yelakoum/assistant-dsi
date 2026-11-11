# Exact code shown in "ML en 1 minute #2" (src/videos/knn/code.ts).
from sklearn.neighbors import (
    KNeighborsClassifier)
X = [[3, 22], [3, 24], [4, 25],
     [5, 27], [7, 31], [8, 37],
     [9, 42], [11, 46]]
y = ["chat"] * 4 + ["chien"] * 4
model = KNeighborsClassifier(3)
model.fit(X, y)
print(model.predict([[6, 28]]))
print(model.predict_proba([[6, 28]]))
