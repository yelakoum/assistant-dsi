// Maths and real Python output for the long-form entropy video.

/** Information (surprise) of an event of probability p, in bits. */
export const information = (p: number) => (p <= 0 ? Infinity : -Math.log2(p));
/** Shannon entropy in bits. */
export const entropyBits = (ps: number[]) => ps.reduce((h, p) => (p > 0 ? h - p * Math.log2(p) : h), 0);
/** Binary entropy H(p) for a coin with P(pile) = p. */
export const coinEntropy = (p: number) => entropyBits([p, 1 - p]);

export const FAIR = [0.5, 0.5];
export const BIASED = [0.9, 0.1];

export const FILE_NAME = "entropie.py";
export const CODE = [
  "from scipy.stats import entropy",
  "print(entropy([0.5, 0.5], base=2))",
  "print(entropy([0.9, 0.1], base=2))",
  "print(entropy([0.25] * 4, base=2))",
];
export const COMMAND = "python entropie.py";
// Real output of `.venv/bin/python scripts/video/entropy_demo.py` (SciPy).
export const OUTPUT = ["1.0", "0.46899559358928117", "2.0"];

/** Quiz: 4 colours, one comes out 9 times out of 10 → 0.63 bit (< 2 bits). Not revealed in the video. */
export const QUIZ_ENTROPY = entropyBits([0.9, 0.1 / 3, 0.1 / 3, 0.1 / 3]);

export const PALETTE = ["#4fc1ff", "#ff4d5e", "#3ddc84", "#ffe600", "#ff9f43", "#c586c0", "#ffffff", "#4ec9b0"];
