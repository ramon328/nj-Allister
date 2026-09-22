import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { announcements, links, menuLinks } from "../data";
import { useFinePointer, useReducedMotion } from "../hooks/useMotion";
import { gsap, lockScroll, reduced } from "../lib/motion";

/* ------------------------------------------------------------------------
   Preloader — counter, bar, then the whole panel peels upward
   ------------------------------------------------------------------------ */
export function Loader({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) { setGone(true); onDone(); return; }

    document.body.classList.add("is-locked");
    const num = el.querySelector<HTMLElement>(".loader__num")!;
    const bar = el.querySelector<HTMLElement>(".loader__bar span")!;
    const mark = el.querySelector<HTMLElement>(".loader__mark")!;
    const text = el.querySelector<HTMLElement>(".loader__text")!;
    const counter = { v: 0 };
    let cancelled = false;

    const tl = gsap.timeline({
      onComplete: () => {
        if (cancelled) return;
        document.body.classList.remove("is-locked");
        setGone(true);
        onDone();
      },
    });
    tl.from(mark, { scale: 0.7, opacity: 0, duration: 1.1, ease: "expo.out" }, 0)
      .from(text, { y: 14, opacity: 0, duration: 0.9 }, 0.15)
      .to(counter, {
        v: 100, duration: 1.7, ease: "power3.inOut",
        onUpdate: () => { num.textContent = String(Math.round(counter.v)).padStart(3, "0"); },
      }, 0.1)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.7, ease: "power3.inOut" }, 0.1)
      .to([mark, text, num], { y: -40, opacity: 0, duration: 0.7, ease: "power3.in", stagger: 0.05 }, "+=0.1")
      .to(el, { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "-=0.35");

    return () => { cancelled = true; tl.kill(); };
  }, [onDone]);

  if (gone) return null;
  return (
    <div ref={ref} className="loader" aria-hidden="true">
      <div className="loader__mark">
        <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" />
          <path d="M43 26h14l13 46h-9l-3-11H42l-3 11h-9l13-46zm2 27h10l-5-18-5 18z" fill="currentColor" />
        </svg>
      </div>
      <p className="loader__text">Allister Eyewear<sup>®</sup></p>
      <div className="loader__bar"><span /></div>
      <span className="loader__num">000</span>
    </div>
  );
}

/* ------------------------------------------------------------------------
   Custom cursor with contextual label (desktop only)
   ------------------------------------------------------------------------ */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor || !fine || reduce) return;
    const dot = cursor.querySelector<HTMLElement>(".cursor__dot")!;
    const ring = cursor.querySelector<HTMLElement>(".cursor__ring")!;
    const label = cursor.querySelector<HTMLElement>(".cursor__label")!;
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    const onMove = (e: PointerEvent) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      cursor.classList.remove("is-hidden");
    };
    const onLeave = () => cursor.classList.add("is-hidden");
    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const labelled = t.closest<HTMLElement>("[data-cursor]");
      const hover = t.closest("a, button, .card, .hscroll figure");
      cursor.classList.toggle("is-hover", Boolean(hover) && !labelled);
      cursor.classList.toggle("is-label", Boolean(labelled));
      if (labelled) label.textContent = labelled.dataset.cursor ?? "";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerover", onOver);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerover", onOver);
    };
  }, [fine, reduce]);

  return (
    <div ref={ref} className="cursor is-hidden" aria-hidden="true">
      <span className="cursor__dot" />
      <span className="cursor__ring"><span className="cursor__label" /></span>
    </div>
  );
}

/* ------------------------------------------------------------------------
   Top bar: announcement strip + floating pill nav + fullscreen menu
   ------------------------------------------------------------------------ */
export function TopBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 60);
        if (y > 500 && y > lastY.current + 8 && !open) setHidden(true);
        else if (y < lastY.current - 8 || y < 500) setHidden(false);
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    lockScroll(open);
    if (open) setHidden(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Announcement marquee driven by GSAP so it shares the ticker.
  useEffect(() => {
    const track = announceRef.current;
    if (!track || reduced()) return;
    const tween = gsap.to(track, { xPercent: -50, ease: "none", duration: 36, repeat: -1 });
    return () => { tween.kill(); };
  }, []);

  const items = [...announcements, ...announcements];

  return (
    <>
      <header className={`top ${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""} ${open ? "is-menu-open" : ""}`}>
        <div className="announce" role="region" aria-label="Promociones">
          <div className="announce__clip">
            <div className="announce__track" ref={announceRef}>
              {items.map((t, i) => (<span key={i}>{t}<i /></span>))}
            </div>
          </div>
        </div>
        <div className="nav">
          <div className="nav__pill">
            <a href="/" className="nav__logo" aria-label="Allister Eyewear, inicio">
              <img src="/assets/web/logo.png" alt="Allister Eyewear" width="180" height="70" />
            </a>
            <nav className="nav__links" aria-label="Principal">
              <a href={links.luxe}>Sol</a>
              <a href={links.azul}>Lectura</a>
              <a href={links.lookbook}>Lookbook</a>
              <a href={links.about}>Quiénes somos</a>
              <a href={links.blog}>Blog</a>
              <a href={links.oferta} className="nav__offer">Ofertas</a>
            </nav>
            <div className="nav__actions">
              <a href={links.search} className="nav__icon" aria-label="Buscar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
              </a>
              <a href={links.account} className="nav__icon" aria-label="Mi cuenta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
              </a>
              <a href={links.cart} className="nav__icon nav__cart" aria-label="Carro de compras">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
                <span className="nav__count">0</span>
              </a>
              <button
                className="nav__burger"
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={open}
                aria-controls="menu"
                onClick={() => setOpen((v) => !v)}
              >
                <span /><span />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`menu ${open ? "is-open" : ""}`} id="menu" aria-hidden={!open}>
        <div className="menu__inner">
          <nav className="menu__links" aria-label="Menú móvil">
            {menuLinks.map((l, i) => (
              <a key={l.href} href={l.href} style={{ "--i": i } as React.CSSProperties} onClick={() => setOpen(false)}>
                <small>{String(i + 1).padStart(2, "0")}</small>{l.label}
              </a>
            ))}
          </nav>
          <div className="menu__aside" style={{ "--i": menuLinks.length } as React.CSSProperties}>
            <div className="menu__img">
              <img src="/assets/web/banner-luxe-ryder-mujer.jpg" alt="Mujer con anteojos Ryder espejados de Allister" loading="lazy" />
            </div>
            <p className="menu__contact">
              <a href={links.whatsapp}>+56 9 5858 4949</a>
              <a href={links.email}>contacto@allister-eyewear.com</a>
            </p>
            <p className="menu__social">
              <a href={links.instagram}>Instagram</a>
              <a href={links.tiktok}>TikTok</a>
              <a href={links.facebook}>Facebook</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
