import React from "react";
import { COLORS } from "../theme";

export type Token = { text: string; color: string; bold?: boolean };

const KEYWORDS = new Set([
  "for", "in", "if", "else", "elif", "while", "return", "def", "class",
  "import", "from", "as", "and", "or", "not", "is", "lambda", "with",
  "True", "False", "None",
]);

const TOKEN_RE = /(\s+)|(\d+(?:\.\d+)?)|("[^"]*"?|'[^']*'?)|([A-Za-z_]\w*)|([()[\]{}])|(.)/g;

/** Minimal Python highlighter (VS Code Dark+ colours, bracket-pair colours). */
export const tokenizePython = (code: string): Token[] => {
  const tokens: Token[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const t = m[0];
    let color = COLORS.text;
    if (m[2]) color = COLORS.number;
    else if (m[3]) color = COLORS.string;
    else if (m[4]) {
      const next = code.slice(re.lastIndex).trimStart()[0];
      if (KEYWORDS.has(t)) color = COLORS.keyword;
      else if (next === "(") color = COLORS.func;
      else color = COLORS.variable;
    } else if (m[5]) {
      if ("([{".includes(t)) {
        color = COLORS.brackets[depth % 3];
        depth++;
      } else {
        depth = Math.max(0, depth - 1);
        color = COLORS.brackets[depth % 3];
      }
    }
    tokens.push({ text: t, color });
  }
  return tokens;
};

/** Renders highlighted code, truncated to `visibleChars` (for typing effects). */
export const HighlightedCode: React.FC<{ code: string; visibleChars?: number }> = ({
  code,
  visibleChars = Infinity,
}) => {
  const tokens = tokenizePython(code);
  const out: React.ReactNode[] = [];
  let remaining = visibleChars;
  for (let i = 0; i < tokens.length && remaining > 0; i++) {
    const tok = tokens[i];
    const text = tok.text.slice(0, remaining);
    remaining -= text.length;
    out.push(
      <span key={i} style={{ color: tok.color }}>
        {text}
      </span>,
    );
  }
  return <>{out}</>;
};
