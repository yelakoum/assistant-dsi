# Exact code shown in the entropy video (src/videos/entropy/data.ts).
from scipy.stats import entropy
print(entropy([0.5, 0.5], base=2))
print(entropy([0.9, 0.1], base=2))
print(entropy([0.25] * 4, base=2))
