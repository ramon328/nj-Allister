import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  articles, collections, links, lookbookRowA, lookbookRowB, marqueeItems, stats,
  type Collection,
} from "../data";
import { lerp, useCountUp, useFinePointer, useParallax, useSpotlight } from "../hooks/useMotion";
import { ArrowIcon, Button, Eyebrow, LinkUnderline } from "./ui";

/* ------------------------------------------------------------------------
   Hero
   ------------------------------------------------------------------------ */
export function Hero({ ready }: { ready: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // 1080p on desktop, 720p on small screens to save data.
  const [videoSrc] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 900
      ? "/assets/video/allister-hero-1080.mp4"
      : "/assets/video/allister-hero-720.mp4",
  );
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) v.play().catch(() => {}); else v.pause(); },
      { threshold: 0.05 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <section className={`hero ${ready ? "is-in" : ""}`} id="hero">
      <div className="hero__media">
        <video
          ref={videoRef}
          className="hero__video"
          autoPlay muted loop playsInline
          poster="/assets/web/video-poster.jpg"
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
      <div className="hero__content">
        <Eyebrow className="hero__eyebrow">Colección LUXE · Envío gratis</Eyebrow>
        <h1 className="hero__title">
          <span className="line"><span>Mira el mundo</span></span>
          <span className="line"><span><em>sin reflejos.</em></span></span>
        </h1>
        <p className="hero__lead">
          Anteojos de sol polarizados con protección UV400, ópticos con filtro azul y lectura magnéticos. Diseñados en Chile para el día a día.
        </p>
        <div className="hero__cta">
          <Button href={links.luxe} variant="light">Comprar Sol</Button>
          <LinkUnderline href={links.lookbook} className="hero__link">Ver lookbook</LinkUnderline>
        </div>
      </div>
      <div className="hero__foot">
        <div className="hero__scroll" aria-hidden="true"><span />Scroll</div>
        <ul className="hero__pills" aria-label="Garantías">
          <li>Polarizados</li><li>UV 400</li><li>3 años de garantía</li>
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Marquee
   ------------------------------------------------------------------------ */
export function Marquee() {
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {items.map((t, i) => (<span key={i}>{t}<i>◆</i></span>))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   Collections bento
   ------------------------------------------------------------------------ */
function CollectionCard({ c, index }: { c: Collection; index: number }) {
  const ref = useSpotlight<HTMLAnchorElement>();
  return (
    <a ref={ref} href={c.href} className={`card card--${c.id} reveal spotlight`} style={{ "--d": index } as React.CSSProperties}>
      <div className="card__shell">
        <figure className="card__media"><img src={c.img} alt={c.alt} loading="lazy" /></figure>
        <span className={`badge ${c.badgeAccent ? "badge--accent" : ""}`}>{c.badge}</span>
        <div className="card__body">
          <p className="card__kicker">{c.kicker}</p>
          <h3 className="card__title">{c.title}</h3>
          {c.text && <p className="card__text">{c.text}</p>}
          <span className="card__arrow"><ArrowIcon /></span>
        </div>
      </div>
    </a>
  );
}

export function Collections() {
  return (
    <section className="section collections" id="colecciones">
      <div className="container">
        <div className="section__head reveal">
          <Eyebrow>Colecciones</Eyebrow>
          <h2 className="h2">Cinco formas de<br /><em>ver mejor.</em></h2>
          <LinkUnderline href={links.all}>Ver todo el catálogo</LinkUnderline>
        </div>
        <div className="bento">
          {collections.map((c, i) => <CollectionCard key={c.id} c={c} index={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Story
   ------------------------------------------------------------------------ */
function Stat({ to, prefix, suffix, label, delay }: { to: number; prefix: string; suffix: string; label: string; delay: number }) {
  const ref = useCountUp(to);
  return (
    <div className="reveal" style={{ "--d": delay } as React.CSSProperties}>
      <dt>{prefix}<span ref={ref}>0</span>{suffix}</dt>
      <dd>{label}</dd>
    </div>
  );
}

export function Story() {
  const ref = useRef<HTMLElement>(null);
  useParallax(ref);
  return (
    <section ref={ref} className="section story" id="nosotros">
      <div className="container story__grid">
        <div className="story__text">
          <Eyebrow className="reveal">Quiénes somos</Eyebrow>
          <h2 className="h2 reveal" style={{ "--d": 1 } as React.CSSProperties}>Calidad que se nota.<br /><em>Estilo que perdura.</em></h2>
          <p className="story__p reveal" style={{ "--d": 2 } as React.CSSProperties}>
            Allister Eyewear® nació con una misión clara: llevar anteojos de calidad a quienes valoran el estilo, el cuidado visual y los detalles que marcan la diferencia.
          </p>
          <p className="story__p reveal" style={{ "--d": 3 } as React.CSSProperties}>
            Desde anteojos de sol con protección UV real hasta lentes de uso diario, cada pieza usa materiales de alta calidad, lentes cuidadosamente seleccionados y diseños atemporales que trascienden las tendencias. Protegerse del sol o de las pantallas no debería ser un sacrificio estético.
          </p>
          <dl className="stats">
            {stats.map((s, i) => <Stat key={s.label} {...s} delay={4 + i} />)}
          </dl>
          <div className="reveal" style={{ "--d": 8 } as React.CSSProperties}>
            <Button href={links.about} variant="dark">Nuestra historia</Button>
          </div>
        </div>
        <div className="story__stack" aria-hidden="true">
          <figure className="stack__item stack__item--1" data-speed="0.12"><img src="/assets/web/banner-mujer-rubia-terraza.jpg" alt="" loading="lazy" /></figure>
          <figure className="stack__item stack__item--2" data-speed="-0.08"><img src="/assets/web/banner-hombre-jeep.jpg" alt="" loading="lazy" /></figure>
          <figure className="stack__item stack__item--3" data-speed="0.2"><img src="/assets/web/banner-luxe-ryder-mujer.jpg" alt="" loading="lazy" /></figure>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Benefits
   ------------------------------------------------------------------------ */
const benefitIcons = {
  polarized: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12c0-2 1.5-3 3.5-3h5c2 0 3 1.5 3.5 3M28 12c0-2-1.5-3-3.5-3h-5c-2 0-3 1.5-3.5 3M4 12v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-6M28 12v6a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-6" /><path d="M6 15h8M18 15h8" strokeDasharray="1.5 2" /></svg>
  ),
  uv: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="5" /><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8" /></svg>
  ),
  ship: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h16v13H3zM19 13h6l4 4v5h-10z" /><circle cx="8" cy="24" r="2.2" /><circle cx="23" cy="24" r="2.2" /></svg>
  ),
  design: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l3.5 4.5L25 6l.5 5.7L30 15l-4.5 3.3L25 24l-5.5-1.5L16 27l-3.5-4.5L7 24l-.5-5.7L2 15l4.5-3.3L7 6l5.5 1.5z" /><path d="m12 15 3 3 5-6" /></svg>
  ),
  case: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="24" height="16" rx="4" /><path d="M4 15h24M12 9V7a4 4 0 0 1 8 0v2" /></svg>
  ),
};

const benefits = [
  { icon: benefitIcons.polarized, title: "Lentes polarizados", text: "Sin reflejos en agua, nieve o asfalto. Contraste real." },
  { icon: benefitIcons.uv, title: "Protección UV 400", text: "Bloqueo total de rayos UVA y UVB, certificado." },
  { icon: benefitIcons.ship, title: "Envío rápido", text: "A todo Chile. Gratis sobre $39.900." },
  { icon: benefitIcons.design, title: "Diseño exclusivo", text: "Modelos propios, atemporales, con el sello Allister." },
  { icon: benefitIcons.case, title: "Estuche y paño incluidos", text: "Cada par llega listo para cuidarse." },
];

export function Benefits() {
  return (
    <section className="section benefits">
      <div className="container">
        <ul className="benefits__list">
          {benefits.map((b, i) => (
            <li key={b.title} className="reveal" style={{ "--d": i } as React.CSSProperties}>
              {b.icon}
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Lookbook filmstrips
   ------------------------------------------------------------------------ */
function Filmstrip({ items, dir }: { items: { src: string; alt: string }[]; dir: "left" | "right" }) {
  return (
    <div className="filmstrip" data-dir={dir}>
      <div className="filmstrip__track">
        {[...items, ...items].map((it, i) => (
          <figure key={i}>
            <img src={it.src} alt={i < items.length ? it.alt : ""} aria-hidden={i >= items.length} loading="lazy" />
          </figure>
        ))}
      </div>
    </div>
  );
}

export function Lookbook() {
  return (
    <section className="section lookbook" id="lookbook">
      <div className="container section__head section__head--center reveal">
        <Eyebrow>Lookbook</Eyebrow>
        <h2 className="h2">@allistereyewear</h2>
        <p className="section__sub">Así se ven en la calle, en la oficina y en el mar.</p>
      </div>
      <Filmstrip items={lookbookRowA} dir="left" />
      <Filmstrip items={lookbookRowB} dir="right" />
      <div className="container lookbook__cta reveal">
        <Button href={links.instagram} variant="dark">Seguir en Instagram</Button>
        <LinkUnderline href={links.lookbook}>Ver lookbook completo</LinkUnderline>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Journal — list with floating preview image
   ------------------------------------------------------------------------ */
export function Journal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState(articles[0].img);
  const [on, setOn] = useState(false);
  const fine = useFinePointer();

  useEffect(() => {
    const list = listRef.current, box = floatRef.current, container = containerRef.current;
    if (!list || !box || !container || !fine) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf: number | null = null;
    const render = () => {
      cx = lerp(cx, tx, 0.14); cy = lerp(cy, ty, 0.14);
      box.style.left = `${cx}px`; box.style.top = `${cy}px`;
      raf = Math.abs(cx - tx) > 0.2 || Math.abs(cy - ty) > 0.2 ? requestAnimationFrame(render) : null;
    };
    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (raf === null) raf = requestAnimationFrame(render);
    };
    list.addEventListener("pointermove", onMove);
    return () => { list.removeEventListener("pointermove", onMove); if (raf !== null) cancelAnimationFrame(raf); };
  }, [fine]);

  return (
    <section className="section journal" id="blog">
      <div className="container" ref={containerRef}>
        <div className="section__head reveal">
          <Eyebrow>Blog</Eyebrow>
          <h2 className="h2">Lo que nadie<br /><em>te dice.</em></h2>
          <LinkUnderline href={links.blog}>Todos los artículos</LinkUnderline>
        </div>
        <ol className="journal__list" ref={listRef} onPointerLeave={() => setOn(false)}>
          {articles.map((a, i) => (
            <li key={a.href} className="reveal" style={{ "--d": i } as React.CSSProperties}>
              <a href={a.href} onPointerEnter={() => { setImg(a.img); setOn(true); }}>
                <span className="journal__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="journal__meta"><time dateTime={a.date}>{a.dateLabel}</time><em>{a.category}</em></span>
                <span className="journal__title">{a.title}</span>
                <span className="journal__arrow"><ArrowIcon /></span>
              </a>
            </li>
          ))}
        </ol>
        <div ref={floatRef} className={`journal__float ${on ? "is-on" : ""}`} aria-hidden="true">
          <img src={img} alt="" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Newsletter
   ------------------------------------------------------------------------ */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const valid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!valid(email.trim())) {
      setError("Escribe un correo válido, por ejemplo nombre@correo.cl");
      emailRef.current?.focus();
      return;
    }
    if (!consent) {
      setError("Necesitamos tu consentimiento para enviarte el código.");
      consentRef.current?.focus();
      return;
    }
    // Static build: point this at the Shopify customer form action in production.
    setSent(true);
    setEmail("");
    setConsent(false);
  };

  return (
    <section className="section newsletter" id="newsletter">
      <div className="container">
        <div className="newsletter__shell reveal">
          <div className="newsletter__core">
            <div className="newsletter__bg" aria-hidden="true"><img src="/assets/web/hero-sol-sin-reflejos.jpg" alt="" loading="lazy" /></div>
            <div className="newsletter__text">
              <Eyebrow light>Primera compra</Eyebrow>
              <h2 className="h2">10% de descuento<br /><em>con el código HOLA10.</em></h2>
              <p>Déjanos tu correo y recibe novedades, lanzamientos y promociones antes que nadie.</p>
            </div>
            <form className="newsletter__form" onSubmit={onSubmit} noValidate>
              <label htmlFor="email" className="sr-only">Correo electrónico</label>
              <div className={`field ${error && !valid(email.trim()) ? "is-invalid" : ""}`}>
                <input
                  ref={emailRef} type="email" id="email" name="email" placeholder="tu@correo.cl"
                  autoComplete="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  aria-describedby="emailError" aria-invalid={Boolean(error)}
                />
                <Button type="submit" variant="light">Obtener mi 10%</Button>
              </div>
              <p className="field__error" id="emailError" role="alert">{error}</p>
              <label className="check">
                <input ref={consentRef} type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  Acepto recibir novedades y promociones de Allister por email. Puedes darte de baja cuando quieras.{" "}
                  <a href={links.privacy}>Política de privacidad</a>.
                </span>
              </label>
              {sent && <p className="field__success">Listo. Revisa tu correo, tu código HOLA10 va en camino.</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Footer
   ------------------------------------------------------------------------ */
export function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <img src="/assets/web/logo-light.png" alt="Allister Eyewear" width="220" height="86" loading="lazy" />
            <p>Calidad que se nota.<br />Estilo que perdura.</p>
            <div className="footer__social">
              <a href={links.instagram} aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg></a>
              <a href={links.tiktok} aria-label="TikTok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 3 2.5 5 5.5 5.3" /></svg></a>
              <a href={links.facebook} aria-label="Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" /></svg></a>
              <a href={links.whatsapp} aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"><path d="M4 20l1.3-3.8A8.5 8.5 0 1 1 8.4 19L4 20z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 9.5z" /></svg></a>
            </div>
          </div>
          <nav className="footer__col" aria-label="Tienda">
            <h4>Tienda</h4>
            <a href={links.luxe}>Sol · LUXE</a>
            <a href={links.genA}>Generación-A</a>
            <a href={links.azul}>Filtro Azul</a>
            <a href={links.lectura}>Lectura Magnéticos</a>
            <a href={links.oferta}>Ofertas</a>
          </nav>
          <nav className="footer__col" aria-label="Información">
            <h4>Información</h4>
            <a href={links.about}>Quiénes somos</a>
            <a href={links.lookbook}>Lookbook</a>
            <a href={links.blog}>Blog</a>
            <a href={links.shipping}>Política de envío</a>
            <a href={links.refund}>Política de reembolso</a>
            <a href={links.privacy}>Política de privacidad</a>
          </nav>
          <div className="footer__col">
            <h4>Contacto</h4>
            <a href={links.whatsapp}>+56 9 5858 4949</a>
            <a href="tel:+56950006843">+56 9 5000 6843</a>
            <a href={links.email}>contacto@allister-eyewear.com</a>
            <p>Av. Sergio Viera de Mello 4524, Macul, Santiago.<br />Tienda exclusivamente online.</p>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 Allister Eyewear®. Todos los derechos reservados.</p>
          <p className="footer__pay" aria-label="Medios de pago">Webpay · Mercado Pago · Transferencia</p>
        </div>
      </div>
      <div className="footer__giant" aria-hidden="true">ALLISTER</div>
    </footer>
  );
}
