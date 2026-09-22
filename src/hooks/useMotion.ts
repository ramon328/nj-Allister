import { useEffect, useRef, useState, type RefObject } from "react";

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");

/** Adds `is-in` to every `.reveal` descendant once it enters the viewport. */
export function useRevealObserver<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    root.querySelectorAll<HTMLElement>(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref]);
}

/** Magnetic pull towards the cursor, spring-eased via rAF. */
export function useMagnetic<T extends HTMLElement>(strength = 0.28) {
  const ref = useRef<T | null>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduce) return;
    let raf: number | null = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const render = () => {
      cx = lerp(cx, tx, 0.18);
      cy = lerp(cy, ty, 0.18);
      el.style.transform = `translate(${cx}px, ${cy}px)`;
      raf = Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1 ? requestAnimationFrame(render) : null;
    };
    const kick = () => { if (raf === null) raf = requestAnimationFrame(render); };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; kick(); };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [fine, reduce, strength]);
  return ref;
}

/** Sets --mx/--my custom properties so a radial highlight follows the cursor. */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const fine = useFinePointer();
  useEffect(() => {
    const el = ref.current;
    if (!el || !fine) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [fine]);
  return ref;
}

/** Eased count-up when the element becomes visible. */
export function useCountUp(to: number, duration = 1400) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        if (reduce) { el.textContent = String(to); return; }
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = String(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration, reduce]);
  return ref;
}

/** Vertical parallax for `[data-speed]` children while the section is on screen. */
export function useParallax<T extends HTMLElement>(ref: RefObject<T | null>) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const section = ref.current;
    if (!section || reduce) return;
    const items = Array.from(section.querySelectorAll<HTMLElement>("[data-speed]"));
    if (!items.length) return;
    let active = false;
    let raf: number | null = null;
    const update = () => {
      raf = null;
      const r = section.getBoundingClientRect();
      const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      items.forEach((el) => {
        const speed = Number(el.dataset.speed ?? 0.1);
        el.style.transform = `translate3d(0, ${(-progress * speed * 400).toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => { if (active && raf === null) raf = requestAnimationFrame(update); };
    const io = new IntersectionObserver(
      (entries) => { active = entries[0].isIntersecting; if (active) update(); },
      { rootMargin: "20% 0px" },
    );
    io.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [ref, reduce]);
}
