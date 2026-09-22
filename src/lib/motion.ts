import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
gsap.defaults({ ease: "expo.out", duration: 1.2 });

export { gsap, ScrollTrigger, SplitText };

export const EASE = "expo.out";
export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------------
   Lenis smooth scroll, driven by the GSAP ticker so ScrollTrigger stays in sync
   ------------------------------------------------------------------------ */
let lenis: Lenis | null = null;

export function initLenis() {
  if (lenis || reduced()) return lenis;
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis() {
  return lenis;
}

export function lockScroll(lock: boolean) {
  if (lock) lenis?.stop();
  else lenis?.start();
  document.body.classList.toggle("is-locked", lock);
}

/* ------------------------------------------------------------------------
   Declarative scroll effects. Any element inside `root` can opt in with:
     data-split            heading/paragraph lines rise out of a mask
     data-reveal           block fades up with a blur
     data-reveal-group     children stagger in
     data-clip             card wipes open from a rounded inset
     data-clip="up"        image wipes up from the bottom edge
     data-parallax="0.2"   scrubbed vertical parallax (positive = slower)
     data-scale            image inside an overflow-hidden parent settles from 1.25 to 1
     data-draw             SVG strokes draw themselves
     data-counter="250"    number counts up
     data-delay="0.2"      optional extra delay (seconds) for any of the above
   ------------------------------------------------------------------------ */
export function initScrollEffects(root: HTMLElement) {
  if (reduced()) return () => {};

  const splits: SplitText[] = [];
  const ctx = gsap.context(() => {
    const delayOf = (el: Element) => Number((el as HTMLElement).dataset.delay ?? 0);
    const once = (el: Element, start = "top 86%") => ({ trigger: el, start, once: true });

    root.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
      const split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "sl" });
      splits.push(split);
      gsap.from(split.lines, {
        yPercent: 115,
        rotate: 1.5,
        duration: 1.5,
        stagger: 0.09,
        delay: delayOf(el),
        transformOrigin: "left top",
        scrollTrigger: once(el, "top 88%"),
      });
    });

    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 56,
        opacity: 0,
        filter: "blur(10px)",
        duration: 1.4,
        delay: delayOf(el),
        scrollTrigger: once(el),
      });
    });

    root.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((el) => {
      gsap.from(el.children, {
        y: 56,
        opacity: 0,
        filter: "blur(8px)",
        duration: 1.3,
        stagger: 0.09,
        delay: delayOf(el),
        scrollTrigger: once(el),
      });
    });

    root.querySelectorAll<HTMLElement>("[data-clip]").forEach((el) => {
      const up = el.dataset.clip === "up";
      gsap.from(el, {
        clipPath: up ? "inset(100% 0 0 0)" : "inset(22% 6% 22% 6% round 2rem)",
        y: up ? 0 : 70,
        scale: up ? 1 : 0.96,
        duration: 1.6,
        delay: delayOf(el),
        ease: "expo.inOut",
        scrollTrigger: once(el, "top 90%"),
      });
      if (up) {
        const img = el.querySelector("img");
        if (img) gsap.from(img, { scale: 1.25, duration: 1.8, delay: delayOf(el), ease: "expo.inOut", scrollTrigger: once(el, "top 90%") });
      }
    });

    root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
      const speed = Number(el.dataset.parallax ?? 0.15);
      gsap.fromTo(
        el,
        { yPercent: speed * 40 },
        {
          yPercent: speed * -40,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    root.querySelectorAll<HTMLElement>("[data-scale]").forEach((el) => {
      const img = el.querySelector("img") ?? el;
      gsap.fromTo(
        img,
        { scale: 1.25, yPercent: -6 },
        {
          scale: 1,
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    root.querySelectorAll<HTMLElement>("[data-draw]").forEach((el) => {
      const strokes = el.querySelectorAll("path, circle, rect, line, polyline");
      gsap.from(strokes, {
        drawSVG: "0%",
        duration: 1.8,
        ease: "power2.inOut",
        stagger: 0.12,
        delay: delayOf(el),
        scrollTrigger: once(el),
      });
    });

    // Horizontal drift for giant background words: scrubbed across the parent section.
    root.querySelectorAll<HTMLElement>("[data-drift]").forEach((el) => {
      const amt = Number(el.dataset.drift ?? 20);
      gsap.fromTo(
        el,
        { xPercent: amt },
        { xPercent: -amt, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
      );
    });

    // Rotation scrub for ring elements.
    root.querySelectorAll<HTMLElement>("[data-rotate]").forEach((el) => {
      const deg = Number(el.dataset.rotate ?? 180);
      gsap.fromTo(
        el,
        { rotate: 0 },
        { rotate: deg, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
      );
    });

    // Ambient orbs: slow organic drift, independent of scroll.
    root.querySelectorAll<HTMLElement>(".orb").forEach((el, i) => {
      gsap.to(el, {
        x: () => gsap.utils.random(-60, 60),
        y: () => gsap.utils.random(-50, 50),
        scale: () => gsap.utils.random(0.9, 1.15),
        duration: () => gsap.utils.random(7, 12),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        delay: i * 0.7,
      });
    });

    root.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => {
      const to = Number(el.dataset.counter ?? 0);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: to,
        duration: 1.8,
        ease: "expo.out",
        delay: delayOf(el),
        onUpdate: () => { el.textContent = String(Math.round(obj.v)); },
        scrollTrigger: once(el, "top 85%"),
      });
    });
  }, root);

  return () => {
    ctx.revert();
    splits.forEach((s) => s.revert());
  };
}
