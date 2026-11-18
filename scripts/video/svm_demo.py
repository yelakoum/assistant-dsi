# Exact code shown at the end of the SVM video (src/videos/svm/data.ts).
from sklearn.svm import SVC
X = [[1, 1], [1, 2], [2, 1], [2, 2],
     [4, 4], [5, 4], [4, 5], [5, 5]]
y = [-1, -1, -1, -1, 1, 1, 1, 1]
model = SVC(kernel="linear", C=1000)
model.fit(X, y)
print(model.coef_, model.intercept_)
print(model.support_vectors_)
print(model.predict([[6, 3]]))
