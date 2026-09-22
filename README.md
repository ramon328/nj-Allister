# Allister Eyewear — rediseño 2026

Landing rediseñada para [allister-eyewear.com](https://allister-eyewear.com/) con React 19 + Vite + TypeScript y CSS vanilla.

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
- `src/hooks/useMotion.ts` — reveals por IntersectionObserver, magnetismo, spotlight, parallax, contadores.
- `src/data.ts` — textos, links reales a Shopify y rutas de imágenes.
- `src/styles.css` — sistema de diseño (cream/espresso/ámbar, Clash Display + Satoshi).

## Assets

Todo lo extraído del sitio original vive en `public/assets/`:

- `img/hero`, `img/banners`, `img/instagram`, `img/blog`, `img/collections`, `img/brand` — originales en alta resolución.
- `img/products` — fotos de producto (35 modelos, 2 vistas c/u) y `products.json` con títulos, precios y URLs. **No se publican en la página**, quedan guardadas para uso futuro.
- `video/allister-hero.mp4` (original, 14 MB), `allister-hero-1080.mp4` (desktop, 6.5 MB) y `allister-hero-720.mp4` (móvil, 1.6 MB), ambos sin audio.
- `web/` — copias que usa la página: JPEG calidad 92 sin submuestreo de croma, hasta 2560px de ancho (los originales de 1000px se sirven a resolución nativa), más el logo recortado con fondo transparente.

## Pendientes para producción

- El formulario de newsletter valida en cliente; conectar al `customer form` de Shopify o a la app de email.
- Los enlaces apuntan al Shopify actual. Para integrar como tema, portar las secciones a Liquid o montar la landing como página independiente.
