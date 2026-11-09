import React from "react";
import { FONT_UI } from "../../theme";

/** Rounded glass card with a small coloured label, used under the chart. */
export const InfoCard: React.FC<{
  label: string;
  color: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ label, color, children, style }) => (
  <div
    style={{
      padding: "18px 30px 22px",
      borderRadius: 24,
      backgroundColor: "rgba(13, 17, 23, 0.85)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderLeft: `10px solid ${color}`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
      ...style,
    }}
  >
    <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 24, letterSpacing: 2, color, marginBottom: 8 }}>
      {label}
    </div>
    {children}
  </div>
);
