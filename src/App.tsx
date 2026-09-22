import { useCallback, useRef, useState } from "react";
import { Announce, Cursor, Loader, Nav } from "./components/Chrome";
import { Benefits, Collections, Footer, Hero, Journal, Lookbook, Marquee, Newsletter, Story } from "./components/Sections";
import { useRevealObserver } from "./hooks/useMotion";

export default function App() {
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => setReady(true), []);
  const mainRef = useRef<HTMLDivElement>(null);
  useRevealObserver(mainRef);

  return (
    <div ref={mainRef}>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <Loader onDone={onLoaded} />
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <Announce />
      <Nav />
      <main id="contenido">
        <Hero ready={ready} />
        <Marquee />
        <Collections />
        <Story />
        <Benefits />
        <Lookbook />
        <Journal />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
