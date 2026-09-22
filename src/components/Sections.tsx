import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import {
  articles, collections, links, lookbookRowA, lookbookRowB, marqueeItems, stats,
  type Collection,
} from "../data";
import { useFinePointer, useSpotlight } from "../hooks/useMotion";
import { gsap, ScrollTrigger, SplitText, reduced } from "../lib/motion";
import { ArrowIcon, Button, Eyebrow, LinkUnderline } from "./ui";
import { GiantWord, ImageTrail, Orbs, RingText } from "./Decor";

const heroSlides = [
  { src: "/assets/web/hero-sol-sin-reflejos.jpg", pos: "60% 40%" },
  { src: "/assets/web/hero-generacion-a.jpg", pos: "50% 35%" },
  { src: "/assets/web/banner-mujer-rubia-terraza.jpg", pos: "60% 40%" },
  { src: "/assets/web/hero-filtro-azul.jpg", pos: "50% 40%" },
  { src: "/assets/web/banner-luxe-ryder-mujer.jpg", pos: "60% 30%" },
];

/* ------------------------------------------------------------------------
   Hero — char reveal, circle-reveal slideshow, mouse parallax, scroll "cover"
   ------------------------------------------------------------------------ */
export function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  // Slideshow: each new slide opens as a circle from a random point over the previous one.
  useEffect(() => {
    const root = ref.current;
    if (!root || !ready || reduced()) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>(".hero__slide"));
    const counter = root.querySelector<HTMLElement>(".hero__counter span");
    if (slides.length < 2) return;
    let current = 0;
    let timer = 0;
    let tween: gsap.core.Timeline | null = null;
    const show = (next: number) => {
      const from = slides[current], to = slides[next];
      const ox = gsap.utils.random(25, 75), oy = gsap.utils.random(30, 70);
      const img = to.querySelector("img, video");
      tween?.kill();
      gsap.set(to, { zIndex: 2, clipPath: `circle(0% at ${ox}% ${oy}%)`, visibility: "visible" });
      tween = gsap.timeline({
        onComplete: () => {
          gsap.set(from, { visibility: "hidden", zIndex: 0 });
          gsap.set(to, { zIndex: 1, clipPath: "none" });
          current = next;
        },
      });
      tween.to(to, { clipPath: `circle(142% at ${ox}% ${oy}%)`, duration: 1.8, ease: "expo.inOut" }, 0)
        .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2.4, ease: "expo.out" }, 0)
        .to(from.querySelector("img, video"), { scale: 1.12, duration: 1.8, ease: "power2.inOut" }, 0);
      if (counter) counter.textContent = String(next + 1).padStart(2, "0");
    };
    const loop = () => {
      timer = window.setTimeout(() => { show((current + 1) % slides.length); loop(); }, current === 0 ? 7000 : 4800);
    };
    loop();
    return () => { clearTimeout(timer); tween?.kill(); };
  }, [ready]);

  // Entrance timeline, waits for the preloader and for fonts (SplitText needs final metrics).
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !ready || reduced()) return;
    let split: SplitText | null = null;
    let leadSplit: SplitText | null = null;
    const ctx = gsap.context(() => {});
    let alive = true;

    document.fonts.ready.then(() => {
      if (!alive) return;
      ctx.add(() => {
        const title = root.querySelector<HTMLElement>(".hero__title")!;
        const lead = root.querySelector<HTMLElement>(".hero__lead")!;
        split = new SplitText(title, { type: "chars,words", charsClass: "ch", wordsClass: "wd" });
        leadSplit = new SplitText(lead, { type: "lines", mask: "lines" });

        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.fromTo(root.querySelector(".hero__video"), { scale: 1.35, filter: "blur(14px)" }, { scale: 1, filter: "blur(0px)", duration: 2.8 }, 0)
          .from(split.chars, { yPercent: 130, rotateX: -80, opacity: 0, duration: 1.5, stagger: { each: 0.028, from: "start" } }, 0.15)
          .from(root.querySelector(".hero__eyebrow"), { y: 24, opacity: 0, duration: 1 }, 0.4)
          .from(leadSplit.lines, { yPercent: 110, duration: 1.2, stagger: 0.08 }, 0.8)
          .from(root.querySelectorAll(".hero__cta > *"), { y: 34, opacity: 0, duration: 1.1, stagger: 0.1 }, 1.0)
          .from(root.querySelector(".hero__foot"), { y: 24, opacity: 0, duration: 1 }, 1.2)
          .from(root.querySelectorAll(".hero__pills li"), { y: 14, opacity: 0, stagger: 0.06, duration: 0.8 }, 1.3)
          .from(root.querySelector(".hero__counter"), { y: 14, opacity: 0, duration: 0.8 }, 1.4);

        // Scroll: content lifts and fades while the next section covers the hero.
        const page = document.querySelector(".page");
        if (page) {
          gsap.to(root.querySelector(".hero__content"), {
            yPercent: -30, opacity: 0, ease: "none",
            scrollTrigger: { trigger: page, start: "top bottom", end: "top 30%", scrub: true },
          });
          gsap.to(root.querySelector(".hero__media"), {
            scale: 1.18, filter: "blur(6px) brightness(0.7)", ease: "none",
            scrollTrigger: { trigger: page, start: "top bottom", end: "top top", scrub: true },
          });
          gsap.to(root.querySelector(".hero__foot"), {
            opacity: 0, ease: "none",
            scrollTrigger: { trigger: page, start: "top bottom", end: "top 75%", scrub: true },
          });
        }
        ScrollTrigger.refresh();
      });
    });

    // Mouse parallax on the headline and media.
    const content = root.querySelector<HTMLElement>(".hero__content")!;
    const media = root.querySelector<HTMLElement>(".hero__media")!;
    const cx = gsap.quickTo(content, "x", { duration: 1.2, ease: "power3" });
    const cy = gsap.quickTo(content, "y", { duration: 1.2, ease: "power3" });
    const mx = gsap.quickTo(media, "x", { duration: 1.6, ease: "power3" });
    const my = gsap.quickTo(media, "y", { duration: 1.6, ease: "power3" });
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      cx(nx * 18); cy(ny * 12); mx(nx * -22); my(ny * -14);
    };
    if (window.matchMedia("(hover: hover)").matches) root.addEventListener("pointermove", onMove);

    return () => {
      alive = false;
      root.removeEventListener("pointermove", onMove);
      ctx.revert();
      split?.revert();
      leadSplit?.revert();
    };
  }, [ready]);

  return (
    <section ref={ref} className="hero" id="hero">
      <div className="hero__media">
        <div className="hero__slide is-active">
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
        {heroSlides.map((sl) => (
          <div key={sl.src} className="hero__slide">
            <img src={sl.src} alt="" style={{ objectPosition: sl.pos }} />
          </div>
        ))}
      </div>
      <div className="hero__content">
        <Eyebrow className="hero__eyebrow">Colección LUXE · Envío gratis</Eyebrow>
        <h1 className="hero__title">
          <span className="line">Mira el mundo</span>
          <span className="line"><em>sin reflejos.</em></span>
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
        <p className="hero__counter" aria-hidden="true"><span>01</span> / {String(heroSlides.length + 1).padStart(2, "0")}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Marquee — speed and direction react to scroll velocity, with a skew
   ------------------------------------------------------------------------ */
export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = ref.current;
    if (!track || reduced()) return;
    const tween = gsap.to(track, { xPercent: -50, ease: "none", duration: 26, repeat: -1 });
    const skew = gsap.quickTo(track, "skewX", { duration: 0.5, ease: "power3" });
    let dir = 1;
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity();
        dir = v < 0 ? -1 : 1;
        const boost = gsap.utils.clamp(1, 7, 1 + Math.abs(v) / 350);
        gsap.to(tween, { timeScale: dir * boost, duration: 0.4, overwrite: true, onComplete: () => gsap.to(tween, { timeScale: dir, duration: 1.4, ease: "power2.out" }) });
        skew(gsap.utils.clamp(-14, 14, -v / 90));
      },
    });
    return () => { tween.kill(); st.kill(); };
  }, []);
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track" ref={ref}>
        {items.map((t, i) => (<span key={i}>{t}<i>◆</i></span>))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   Collections bento — clip reveal, 3D tilt, spotlight, inner parallax
   ------------------------------------------------------------------------ */
function CollectionCard({ c, index }: { c: Collection; index: number }) {
  const spot = useSpotlight<HTMLAnchorElement>();
  const fine = useFinePointer();

  useEffect(() => {
    const card = spot.current;
    if (!card || !fine || reduced()) return;
    const rx = gsap.quickTo(card, "rotateX", { duration: 0.7, ease: "power3" });
    const ry = gsap.quickTo(card, "rotateY", { duration: 0.7, ease: "power3" });
    const ty = gsap.quickTo(card, "y", { duration: 0.7, ease: "power3" });
    const glare = card.querySelector<HTMLElement>(".card__glare");
    const gx = glare ? gsap.quickTo(glare, "xPercent", { duration: 0.7, ease: "power3" }) : null;
    const onMove = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx(py * -7); ry(px * 9); ty(-8); gx?.(px * 60);
    };
    const onLeave = () => { rx(0); ry(0); ty(0); gx?.(0); };
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    return () => { card.removeEventListener("pointermove", onMove); card.removeEventListener("pointerleave", onLeave); };
  }, [spot, fine]);

  return (
    <a
      ref={spot}
      href={c.href}
      className={`card card--${c.id} spotlight`}
      data-clip
      data-delay={index * 0.08}
      data-cursor="Ver colección"
    >
      <div className="card__shell">
        <figure className="card__media" data-scale><img src={c.img} alt={c.alt} loading="lazy" /></figure>
        <span className="card__glare" aria-hidden="true" />
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
      <Orbs />
      <GiantWord drift={14}>Colecciones</GiantWord>
      <div className="container">
        <div className="section__head">
          <Eyebrow data-reveal>Colecciones</Eyebrow>
          <h2 className="h2" data-split>Cinco formas de<br /><em>ver mejor.</em></h2>
          <span data-reveal data-delay="0.3"><LinkUnderline href={links.all}>Ver todo el catálogo</LinkUnderline></span>
        </div>
        <div className="bento">
          {collections.map((c, i) => <CollectionCard key={c.id} c={c} index={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Story — split lines, counters, cascading images with parallax + wipe
   ------------------------------------------------------------------------ */
export function Story() {
  return (
    <section className="section story" id="nosotros">
      <div className="story__bg" aria-hidden="true" data-parallax="0.35"><img src="/assets/web/hero-filtro-azul.jpg" alt="" loading="lazy" /></div>
      <GiantWord drift={-16} align="right">Calidad</GiantWord>
      <div className="container story__grid">
        <div className="story__text">
          <Eyebrow data-reveal>Quiénes somos</Eyebrow>
          <h2 className="h2" data-split>Calidad que se nota.<br /><em>Estilo que perdura.</em></h2>
          <p className="story__p" data-split data-delay="0.1">
            Allister Eyewear® nació con una misión clara: llevar anteojos de calidad a quienes valoran el estilo, el cuidado visual y los detalles que marcan la diferencia.
          </p>
          <p className="story__p" data-split data-delay="0.2">
            Desde anteojos de sol con protección UV real hasta lentes de uso diario, cada pieza usa materiales de alta calidad, lentes cuidadosamente seleccionados y diseños atemporales que trascienden las tendencias. Protegerse del sol o de las pantallas no debería ser un sacrificio estético.
          </p>
          <dl className="stats" data-reveal-group>
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.prefix}<span data-counter={s.to}>0</span>{s.suffix}</dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </dl>
          <div className="story__cta" data-reveal data-delay="0.2">
            <Button href={links.about} variant="dark">Nuestra historia</Button>
            <div className="story__ring"><RingText text="ALLISTER EYEWEAR · CALIDAD QUE SE NOTA · ESTILO QUE PERDURA · " size={150} /></div>
          </div>
        </div>
        <div className="story__stack" aria-hidden="true">
          <div className="stack__item stack__item--1" data-parallax="0.18">
            <figure data-clip="circle"><img src="/assets/web/banner-mujer-rubia-terraza.jpg" alt="" loading="lazy" /></figure>
          </div>
          <div className="stack__item stack__item--2" data-parallax="-0.12">
            <figure data-clip="circle" data-delay="0.15"><img src="/assets/web/banner-hombre-jeep.jpg" alt="" loading="lazy" /></figure>
          </div>
          <div className="stack__item stack__item--3" data-parallax="0.3">
            <figure data-clip="circle" data-delay="0.3"><img src="/assets/web/banner-luxe-ryder-mujer.jpg" alt="" loading="lazy" /></figure>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Benefits — icons draw themselves
   ------------------------------------------------------------------------ */
const benefitIcons = {
  polarized: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12c0-2 1.5-3 3.5-3h5c2 0 3 1.5 3.5 3M28 12c0-2-1.5-3-3.5-3h-5c-2 0-3 1.5-3.5 3M4 12v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-6M28 12v6a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-6" /><path d="M6 15h8M18 15h8" /></svg>
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
        <ul className="benefits__list" data-reveal-group>
          {benefits.map((b, i) => (
            <li key={b.title}>
              <span className="benefits__icon" data-draw data-delay={0.2 + i * 0.1}>{b.icon}</span>
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
   Lookbook — pinned horizontal scroll with velocity skew and inner parallax
   ------------------------------------------------------------------------ */
export function Lookbook() {
  const ref = useRef<HTMLDivElement>(null);
  const items = [...lookbookRowA, ...lookbookRowB];

  useLayoutEffect(() => {
    const wrap = ref.current;
    if (!wrap || reduced()) return;
    const track = wrap.querySelector<HTMLElement>(".hscroll__track")!;
    const bar = wrap.querySelector<HTMLElement>(".hscroll__progress span")!;
    const figures = Array.from(track.querySelectorAll<HTMLElement>("figure"));
    const ctx = gsap.context(() => {
      const dist = () => track.scrollWidth - window.innerWidth;
      const skew = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3" });
      const scroll = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(bar, { scaleX: self.progress });
            skew(gsap.utils.clamp(-8, 8, -self.getVelocity() / 260));
          },
        },
      });
      figures.forEach((fig, i) => {
        const img = fig.querySelector("img");
        gsap.fromTo(img, { xPercent: -10 }, {
          xPercent: 10, ease: "none",
          scrollTrigger: { trigger: fig, containerAnimation: scroll, start: "left right", end: "right left", scrub: true },
        });
        gsap.from(fig, {
          yPercent: i % 2 ? 18 : -18, rotate: i % 2 ? 4 : -4, opacity: 0, duration: 1.2,
          scrollTrigger: { trigger: fig, containerAnimation: scroll, start: "left 95%", once: true },
        });
      });
    }, wrap);
    return () => ctx.revert();
  }, []);

  return (
    <section className="section lookbook" id="lookbook">
      <Orbs />
      <ImageTrail images={items.map((i) => i.src)} className="lookbook__head">
        <div className="container section__head section__head--center">
          <Eyebrow data-reveal>Lookbook</Eyebrow>
          <h2 className="h2" data-split>@allistereyewear</h2>
          <p className="section__sub" data-reveal data-delay="0.2">Mueve el mouse. Así se ven en la calle, en la oficina y en el mar.</p>
        </div>
      </ImageTrail>
      <div className="hscroll" ref={ref}>
        <div className="hscroll__track">
          {items.map((it, i) => (
            <figure key={it.src} className={i % 3 === 1 ? "is-tall" : ""} data-cursor="Ver">
              <img src={it.src} alt={it.alt} loading="lazy" />
            </figure>
          ))}
          <div className="hscroll__end">
            <p className="h2">Más en<br /><em>Instagram.</em></p>
            <Button href={links.instagram} variant="dark">Seguir @allistereyewear</Button>
          </div>
        </div>
        <div className="hscroll__progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Zoom — a photo grows from a framed card to full-bleed while pinned
   ------------------------------------------------------------------------ */
export function Zoom() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const section = ref.current;
    if (!section || reduced()) return;
    const ctx = gsap.context(() => {
      const media = section.querySelector<HTMLElement>(".zoom__media")!;
      const img = media.querySelector("img")!;
      const text = section.querySelector<HTMLElement>(".zoom__text")!;
      const frame = section.querySelector<HTMLElement>(".zoom__frame")!;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=160%", pin: true, scrub: 0.6, anticipatePin: 1 },
      });
      tl.fromTo(media, { clipPath: "circle(14% at 50% 50%)" }, { clipPath: "circle(80% at 50% 50%)", ease: "power2.inOut", duration: 1 }, 0)
        .fromTo(img, { scale: 1.3 }, { scale: 1, ease: "none", duration: 1.6 }, 0)
        .to(frame, { opacity: 0, scale: 1.1, duration: 0.5 }, 0)
        .fromTo(text, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.6 }, 0.7);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="zoom" aria-label="Hechos para el sol de verdad">
      <figure className="zoom__media">
        <img src="/assets/web/banner-hombre-jeep.jpg" alt="Pareja con anteojos de sol Allister caminando junto a un muro de acero" loading="lazy" />
      </figure>
      <div className="zoom__frame" aria-hidden="true"><span /></div>
      <div className="zoom__text">
        <Eyebrow light>Polarizados</Eyebrow>
        <h2 className="h2">Hechos para<br /><em>el sol de verdad.</em></h2>
        <p>Sin reflejos en la ciudad, en el agua ni en el asfalto. Contraste real donde más importa.</p>
        <Button href={links.luxe} variant="light">Ver anteojos de sol</Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------
   Journal — list rows with a floating preview that follows the cursor
   ------------------------------------------------------------------------ */
export function Journal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState(articles[0].img);
  const [on, setOn] = useState(false);
  const fine = useFinePointer();

  useEffect(() => {
    const box = floatRef.current, container = containerRef.current;
    if (!box || !container || !fine || reduced()) return;
    const fx = gsap.quickTo(box, "x", { duration: 0.9, ease: "power3" });
    const fy = gsap.quickTo(box, "y", { duration: 0.9, ease: "power3" });
    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      fx(e.clientX - r.left); fy(e.clientY - r.top);
    };
    container.addEventListener("pointermove", onMove);
    return () => container.removeEventListener("pointermove", onMove);
  }, [fine]);

  return (
    <section className="section journal" id="blog">
      <GiantWord drift={12}>Blog</GiantWord>
      <div className="container" ref={containerRef}>
        <div className="section__head">
          <Eyebrow data-reveal>Blog</Eyebrow>
          <h2 className="h2" data-split>Lo que nadie<br /><em>te dice.</em></h2>
          <span data-reveal data-delay="0.3"><LinkUnderline href={links.blog}>Todos los artículos</LinkUnderline></span>
        </div>
        <ol className="journal__list" data-reveal-group onPointerLeave={() => setOn(false)}>
          {articles.map((a, i) => (
            <li key={a.href}>
              <a href={a.href} data-cursor="Leer" onPointerEnter={() => { setImg(a.img); setOn(true); }}>
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
        <div className="newsletter__shell" data-clip>
          <div className="newsletter__core">
            <div className="newsletter__bg" aria-hidden="true" data-scale><img src="/assets/web/hero-sol-sin-reflejos.jpg" alt="" loading="lazy" /></div>
            <div className="newsletter__text">
              <Eyebrow light data-reveal>Primera compra</Eyebrow>
              <h2 className="h2" data-split data-delay="0.1">10% de descuento<br /><em>con el código HOLA10.</em></h2>
              <p data-reveal data-delay="0.3">Déjanos tu correo y recibe novedades, lanzamientos y promociones antes que nadie.</p>
            </div>
            <form className="newsletter__form" onSubmit={onSubmit} noValidate data-reveal data-delay="0.4">
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
   Footer — revealed from under the page; giant wordmark rises letter by letter
   ------------------------------------------------------------------------ */
export function Footer() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const footer = ref.current;
    if (!footer || reduced()) return;
    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      const page = document.querySelector(".page");
      if (!page) return;
      const giant = footer.querySelector<HTMLElement>(".footer__giant")!;
      split = new SplitText(giant, { type: "chars" });
      gsap.from(split.chars, {
        yPercent: 100, opacity: 0, stagger: 0.04, ease: "none",
        scrollTrigger: { trigger: page, start: "bottom 90%", end: "bottom 35%", scrub: true },
      });
      gsap.from(footer.querySelector(".footer__top"), {
        y: 80, opacity: 0, ease: "none",
        scrollTrigger: { trigger: page, start: "bottom 95%", end: "bottom 45%", scrub: true },
      });
    }, footer);
    return () => { ctx.revert(); split?.revert(); };
  }, []);

  return (
    <footer ref={ref} className="footer" id="contacto">
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
            <a href={links.whatsapp}>+56 9 7879 2683</a>
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
