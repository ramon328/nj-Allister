import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Cursor, Loader, TopBar } from "./components/Chrome";
import { Benefits, Collections, Footer, Hero, Journal, Lookbook, Marquee, Newsletter, Story } from "./components/Sections";
import { ScrollTrigger, initLenis, initScrollEffects } from "./lib/motion";

export default function App() {
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => setReady(true), []);
  const rootRef = useRef<HTMLDivElement>(null);

  // Smooth scroll + every declarative scroll effect, after fonts settle.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    initLenis();
    let cleanup: (() => void) | null = null;
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      cleanup = initScrollEffects(root);
      ScrollTrigger.refresh();
    });
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      alive = false;
      cleanup?.();
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <Loader onDone={onLoaded} />
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <TopBar />
      <main id="contenido">
        <div className="hero-wrap">
          <Hero ready={ready} />
        </div>
        <div className="page">
          <Marquee />
          <Collections />
          <Story />
          <Benefits />
          <Lookbook />
          <Journal />
          <Newsletter />
        </div>
      </main>
      <Footer />
    </div>
  );
}
