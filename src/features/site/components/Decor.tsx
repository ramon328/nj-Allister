"use client";
import { useEffect, useRef } from "react";
import { useFinePointer } from "../use-motion";
import { gsap, reduced } from "../motion";

/** Soft amber light blobs that drift behind a section. */
export function Orbs({ variant = "warm" }: { variant?: "warm" | "dark" }) {
  return (
    <div className={`orbs orbs--${variant}`} aria-hidden="true">
      <span className="orb orb--1" data-parallax="0.25" />
      <span className="orb orb--2" data-parallax="-0.15" />
      <span className="orb orb--3" data-parallax="0.4" />
    </div>
  );
}

/** Giant outlined word that slides sideways as the section scrolls. */
export function GiantWord({ children, drift = 18, align = "left" }: { children: string; drift?: number; align?: "left" | "right" }) {
  return (
    <div className={`giant giant--${align}`} aria-hidden="true">
      <span data-drift={drift}>{children}</span>
    </div>
  );
}

/** Rotating ring of text (SVG textPath), rotation scrubbed by scroll. */
export function RingText({ text, size = 260 }: { text: string; size?: number }) {
  return (
    <div className="ring" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 200 200" data-rotate="240">
        <defs>
          <path id="ringPath" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text><textPath href="#ringPath">{text}</textPath></text>
      </svg>
      <span className="ring__core">
        <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" />
          <path d="M43 26h14l13 46h-9l-3-11H42l-3 11h-9l13-46zm2 27h10l-5-18-5 18z" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}

/** Photos spawn under the cursor as it moves across the wrapped area, then fade out. */
export function ImageTrail({ images, children, className = "" }: { images: string[]; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();

  useEffect(() => {
    const zone = ref.current;
    if (!zone || !fine || reduced()) return;
    let last = { x: -999, y: -999 };
    let i = 0;
    let live = 0;
    const onMove = (e: PointerEvent) => {
      const r = zone.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (Math.hypot(x - last.x, y - last.y) < 90 || live > 10) return;
      last = { x, y };
      const img = document.createElement("img");
      img.src = images[i++ % images.length];
      img.alt = "";
      img.className = "trail__img";
      zone.appendChild(img);
      live++;
      gsap.fromTo(
        img,
        { x, y, xPercent: -50, yPercent: -50, scale: 0.3, rotate: gsap.utils.random(-18, 18), opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "expo.out" },
      );
      gsap.to(img, {
        y: y - 60, scale: 0.7, opacity: 0, duration: 0.9, delay: 0.8, ease: "power2.in",
        onComplete: () => { img.remove(); live--; },
      });
    };
    zone.addEventListener("pointermove", onMove);
    return () => zone.removeEventListener("pointermove", onMove);
  }, [fine, images]);

  return <div ref={ref} className={`trail ${className}`.trim()}>{children}</div>;
}
