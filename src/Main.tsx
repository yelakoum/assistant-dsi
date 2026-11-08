import { AbsoluteFill } from "remotion";
import { TikTokSafeArea } from "./components/TikTokSafeArea";

// Placeholder composition — scenes will be added later.
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <TikTokSafeArea />
    </AbsoluteFill>
  );
};
