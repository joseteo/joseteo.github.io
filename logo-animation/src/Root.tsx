import { Composition } from "remotion";
import { LogoAnimation } from "./LogoAnimation";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LogoAnimation"
        component={LogoAnimation}
        durationInFrames={90}
        fps={30}
        width={400}
        height={350}
      />
    </>
  );
};
