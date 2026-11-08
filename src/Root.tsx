import { Composition } from "remotion";
import { Main } from "./Main";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH, secondsToFrames } from "./config";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      fps={VIDEO_FPS}
      durationInFrames={secondsToFrames(5)}
    />
  );
};
