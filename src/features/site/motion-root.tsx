"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger, initLenis, initScrollEffects } from "./motion";

/** Scroll suave + efectos declarativos (data-reveal, data-split…) para cualquier página del sitio. */
export function MotionRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useLayoutEffect(() => {
    const root = ref.current;
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
  }, [pathname]);
  return <div ref={ref}>{children}</div>;
}
