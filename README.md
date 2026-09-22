# Allister Eyewear — rediseño 2026

Landing rediseñada para [allister-eyewear.com](https://allister-eyewear.com/) con React 19 + Vite + TypeScript, CSS vanilla, GSAP (ScrollTrigger, SplitText, DrawSVG) y Lenis para scroll suave.

## Correr

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/
```

## Estructura

- `src/App.tsx` — composición de la página.
- `src/components/Chrome.tsx` — preloader, cursor, barra de anuncios, nav y menú fullscreen.
- `src/components/Sections.tsx` — hero, marquee, colecciones (bento), historia, beneficios, lookbook, blog, newsletter, footer.
- `src/components/ui.tsx` — botón isla magnético, eyebrow, link subrayado.
- `src/lib/motion.ts` — GSAP + Lenis. Sistema declarativo por atributos: `data-split`, `data-reveal`, `data-reveal-group`, `data-clip`, `data-parallax`, `data-scale`, `data-draw`, `data-counter`.
- `src/hooks/useMotion.ts` — botones magnéticos y spotlight con `gsap.quickTo`.
- `src/data.ts` — textos, links reales a Shopify y rutas de imágenes.
- `src/styles.css` — sistema de diseño (cream/espresso/ámbar, Clash Display + Satoshi).

## Assets

Todo lo extraído del sitio original vive en `public/assets/`:

- `img/hero`, `img/banners`, `img/instagram`, `img/blog`, `img/collections`, `img/brand` — originales en alta resolución.
- `img/products` — fotos de producto (35 modelos, 2 vistas c/u) y `products.json` con títulos, precios y URLs. **No se publican en la página**, quedan guardadas para uso futuro.
- `video/allister-hero.mp4` (original, 14 MB), `allister-hero-1080.mp4` (desktop, 6.5 MB) y `allister-hero-720.mp4` (móvil, 1.6 MB), ambos sin audio.
- `web/` — copias que usa la página: JPEG calidad 92 sin submuestreo de croma, hasta 2560px de ancho. Los originales que Shopify solo tenía en 1000px pasaron por Real-ESRGAN 4x (Upscayl, modelo high-fidelity) y se sirven a 2000px. Logo recortado con fondo transparente.

## Animaciones

- Preloader con contador y cortina que se pliega.
- Hero: letras del título entran con rotación 3D, video hace settle desde blur, parallax con el mouse, y la página cubre el hero al scrollear (hero sticky).
- Marquee que acelera y se inclina según la velocidad del scroll.
- Bento: cards se abren por clip-path, tilt 3D con glare, spotlight, parallax interno.
- Historia: líneas de texto salen de máscara, contadores, fotos con wipe y parallax a distintas velocidades.
- Beneficios: iconos se dibujan (DrawSVG).
- Lookbook: sección fijada con scroll horizontal, skew por velocidad, parallax en cada foto.
- Footer: queda debajo y se revela al terminar la página; ALLISTER gigante sube letra por letra.
- Cursor custom con etiqueta contextual ("Ver colección", "Leer").
- Todo respeta `prefers-reduced-motion`.

## Pendientes para producción

- El formulario de newsletter valida en cliente; conectar al `customer form` de Shopify o a la app de email.
- Los enlaces apuntan al Shopify actual. Para integrar como tema, portar las secciones a Liquid o montar la landing como página independiente.
