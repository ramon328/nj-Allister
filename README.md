# Allister Eyewear — tienda online

E-commerce de anteojos para [allister-eyewear.com](https://allister-eyewear.com/): Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage) + Mercado Pago Checkout Pro. Diseño editorial con GSAP (ScrollTrigger, SplitText, DrawSVG) y Lenis.

## Qué incluye

- **Portada** con las animaciones del rediseño (hero con slideshow en círculo, bento de colecciones, historia, zoom, lookbook horizontal, blog, newsletter) y una grilla de productos destacados.
- **Catálogo** `/coleccion` con filtros por colección, tipo (sol/óptico/lectura), búsqueda, orden y paginación.
- **Producto** `/lentes/[slug]`: galería, precio y descuento, otros colores del mismo modelo, variantes (fuerza óptica), agregar al carro, relacionados, JSON-LD.
- **Carro** en panel lateral y página `/carrito`, guardado en localStorage.
- **Checkout de invitado** `/checkout`: datos, dirección con comunas y códigos postales de Chile, código de descuento (HOLA10 10% precargado), términos. Crea el pedido, descuenta stock y calcula despacho (gratis desde $39.900, configurable).
- **Pedido** `/pedido/[id]?k=token`: resumen, aceptación expresa del total, pago con Mercado Pago, cancelación, historial. `/pedido` para seguir un pedido por número + correo.
- **Mercado Pago**: creación de preferencia, webhook con verificación de firma y consulta a la API, conciliación automática si el webhook se pierde, reembolsos desde el panel.
- **Panel** `/admin` (Supabase Auth): resumen y ventas, pedidos (estados, despacho, seguimiento, notas, alertas de pago), productos (CRUD, stock en línea, subida de fotos optimizadas a Storage), colecciones, códigos de descuento, configuración (despacho, envío gratis, WhatsApp, barra de anuncios), Mercado Pago (cuenta y pagos).
- **Cron** horario: cancela pedidos sin pago a las 48 h (devuelve stock), concilia pagos, limpia límites por IP.
- **Correos** opcionales vía Resend: pedido recibido, pago confirmado, enviado, cancelado, y aviso interno de venta.
- **Modo Próximamente** con `COMING_SOON=1` para el dominio público mientras se revisa.

## Correr en local

```bash
npm install
cp .env.example .env.local   # completa las variables
npm run db:migrate           # aplica supabase/migrations/*.sql
npm run db:seed              # carga los 250 productos exportados de Shopify
npm run admin:create -- tu@correo.cl   # crea el usuario del panel (imprime la contraseña)
npm run dev
```

## Variables de entorno

Ver `.env.example`. Las obligatorias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (solo para scripts), `NEXT_PUBLIC_SITE_URL`. Para cobrar: `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`. Para el cron: `CRON_SECRET`. Para correos: `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_NOTIFY`.

## Conectar Mercado Pago

1. Crear una aplicación tipo Checkout Pro en [mercadopago.cl/developers](https://www.mercadopago.cl/developers/panel/app).
2. Copiar el *Access Token* de producción en `MP_ACCESS_TOKEN`.
3. En Webhooks, registrar `https://<dominio>/api/webhooks/mercadopago` con el evento **Pagos** y copiar la clave secreta en `MP_WEBHOOK_SECRET`.
4. Redesplegar. `/admin/mercadopago` muestra la cuenta y los pagos.

Con credenciales de prueba (`TEST-…`) el mismo flujo abre el checkout de prueba.

## Estructura

- `src/app/(site)` — páginas públicas. `src/app/admin` — panel. `src/app/api` — webhook, cron, búsqueda.
- `src/features/site` — landing animada (componentes, `motion.ts` con el sistema declarativo `data-split`, `data-reveal`, `data-clip`, `data-parallax`…).
- `src/features/catalog|cart|orders|auth|admin` — queries, server actions, schemas (zod) y UI.
- `src/lib` — Supabase (server/admin/proxy), sesión y roles, Mercado Pago, correo, comunas y códigos postales.
- `supabase/migrations/0001_init.sql` — esquema completo con RLS, funciones (`create_guest_order`, `expire_pending_orders`, `rate_allow`, `search_catalog`) y bucket `productos`.
- `supabase/data/shopify` — exportación del catálogo original para el seed.
- `public/assets` — fotos y video de la marca (las de producto quedan en `img/products` como respaldo; la tienda usa las URLs del CDN de Shopify hasta que se suban fotos nuevas desde el panel).

## Seguridad

RLS en todas las tablas (default deny); las funciones que tocan pedidos solo se ejecutan con service role desde el servidor; precios y stock se validan en Postgres al crear el pedido; el estado `paid` solo lo escribe el webhook o la conciliación (nunca el redirect del navegador); límites por IP en checkout, login, seguimiento, códigos y webhook; token del pedido comparado en tiempo constante y transportado por cookie httpOnly al volver de Mercado Pago; marcar pagado a mano exige superadmin y una nota.
