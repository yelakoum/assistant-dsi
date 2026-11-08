// Fonts are bundled from npm (@fontsource) so renders never depend on a CDN.
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import { cancelRender, continueRender, delayRender } from "remotion";

const handle = delayRender("Loading fonts");

Promise.all(
  [
    '400 38px "JetBrains Mono"',
    '700 38px "JetBrains Mono"',
    '600 28px "Montserrat"',
    '800 28px "Montserrat"',
    '900 70px "Montserrat"',
  ].map((font) => document.fonts.load(font)),
)
  .then(() => continueRender(handle))
  .catch((err) => cancelRender(err));
