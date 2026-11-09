# Exact code shown in the LinearRegression TikTok video (keep in sync with
# src/videos/linear-regression/code.ts). Run it to get the terminal output.
from sklearn.linear_model import (
    LinearRegression)
X = [[30], [45], [55],
     [70], [85], [100]]
y = [140, 215, 200, 290, 300, 390]
model = LinearRegression()
model.fit(X, y)
print(model.coef_, model.intercept_)
print(model.predict([[75]]))
print(model.score(X, y))
