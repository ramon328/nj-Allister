import { useEffect, useRef, useState } from "react";
import { announcements, links, menuLinks } from "../data";
import { lerp, useFinePointer, useReducedMotion } from "../hooks/useMotion";

/* ------------------------------------------------------------------------
   Preloader
   ------------------------------------------------------------------------ */
export function Loader({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (reduce) { setDone(true); onDone(); return; }
    document.body.classList.add("is-locked");
    const minWait = new Promise<void>((r) => setTimeout(r, 1300));
    const loaded = new Promise<void>((r) => {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", () => r(), { once: true });
    });
    let cancelled = false;
    Promise.all([minWait, loaded]).then(() => {
      if (cancelled) return;
      document.body.classList.remove("is-locked");
      setDone(true);
      onDone();
    });
    return () => { cancelled = true; };
  }, [reduce, onDone]);

  return (
    <div className={`loader ${done ? "is-done" : ""}`} aria-hidden="true">
      <div className="loader__mark">
        <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" />
          <path d="M43 26h14l13 46h-9l-3-11H42l-3 11h-9l13-46zm2 27h10l-5-18-5 18z" fill="currentColor" />
        </svg>
      </div>
      <div className="loader__bar"><span /></div>
      <p className="loader__text">Allister Eyewear<sup>®</sup></p>
    </div>
  );
}

/* ------------------------------------------------------------------------
   Custom cursor (desktop only)
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
    let tx = -100, ty = -100, cx = -100, cy = -100;
    let raf: number | null = null;
    const render = () => {
      cx = lerp(cx, tx, 0.22);
      cy = lerp(cy, ty, 0.22);
      dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = Math.abs(cx - tx) > 0.2 || Math.abs(cy - ty) > 0.2 ? requestAnimationFrame(render) : null;
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.remove("is-hidden");
      if (raf === null) raf = requestAnimationFrame(render);
    };
    const onLeave = () => cursor.classList.add("is-hidden");
    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      cursor.classList.toggle("is-hover", Boolean(t.closest("a, button, .card, .filmstrip figure")));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerover", onOver);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerover", onOver);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [fine, reduce]);
  return (
    <div ref={ref} className="cursor is-hidden" aria-hidden="true">
      <span className="cursor__dot" /><span className="cursor__ring" />
    </div>
  );
}

/* ------------------------------------------------------------------------
   Announcement bar
   ------------------------------------------------------------------------ */
export function Announce() {
  const items = [...announcements, ...announcements];
  return (
    <div className="announce" role="region" aria-label="Promociones">
      <div className="announce__track">
        {items.map((t, i) => (
          <span key={i}>{t}<i /></span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   Nav + fullscreen menu
   ------------------------------------------------------------------------ */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 80);
        if (y > 400 && y > lastY.current + 6 && !open) setHidden(true);
        else if (y < lastY.current - 6 || y < 400) setHidden(false);
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    document.body.classList.toggle("is-locked", open);
    if (open) setHidden(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={`nav ${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""} ${open ? "is-menu-open" : ""}`}>
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
