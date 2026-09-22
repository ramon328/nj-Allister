export const SHOP = "https://allister-eyewear.com";

export const links = {
  luxe: `${SHOP}/collections/luxe`,
  genA: `${SHOP}/collections/generacion-a`,
  azul: `${SHOP}/collections/filtro-azul`,
  lectura: `${SHOP}/collections/lectura`,
  oferta: `${SHOP}/collections/oferta`,
  all: `${SHOP}/collections/all`,
  lookbook: `${SHOP}/pages/galeria`,
  about: `${SHOP}/pages/quines-somos`,
  blog: `${SHOP}/blogs/news`,
  contact: `${SHOP}/pages/contact`,
  search: `${SHOP}/search`,
  account: `${SHOP}/account`,
  cart: `${SHOP}/cart`,
  privacy: `${SHOP}/policies/privacy-policy`,
  refund: `${SHOP}/policies/refund-policy`,
  shipping: `${SHOP}/policies/shipping-policy`,
  instagram: "https://www.instagram.com/allistereyewear/",
  facebook: "https://www.facebook.com/allistereyewear",
  tiktok: "https://tiktok.com/@allistereyewear",
  whatsapp: "https://wa.me/56978792683",
  email: "mailto:contacto@allister-eyewear.com",
};

export const announcements = [
  "Envío gratis por compras sobre $39.900",
  "2x1 en anteojos de lectura magnéticos",
  "40% OFF Colección Generación-A",
  "20% dcto en Filtro Azul, automático en el carro",
];

export const marqueeItems = [
  "Polarizados",
  "Protección UV 400",
  "3 años de garantía",
  "Envío a todo Chile",
  "Diseño exclusivo",
];

export type Collection = {
  id: "luxe" | "gen" | "azul" | "lectura" | "oferta";
  href: string;
  img: string;
  alt: string;
  badge: string;
  badgeAccent?: boolean;
  kicker: string;
  title: string;
  text?: string;
};

export const collections: Collection[] = [
  {
    id: "luxe",
    href: links.luxe,
    img: "/assets/web/hero-generacion-a.jpg",
    alt: "Pareja probándose anteojos frente al mar, colección LUXE",
    badge: "Envío gratis",
    kicker: "Sol · 112 modelos",
    title: "LUXE",
    text: "Descubre el mundo sin reflejos. Lentes polarizados, marcos de acetato y detalles metálicos.",
  },
  {
    id: "gen",
    href: links.genA,
    img: "/assets/web/hero-sol-sin-reflejos.jpg",
    alt: "Hombre con sombrero y anteojos de sol espejados naranja, colección Generación-A",
    badge: "40% OFF",
    badgeAccent: true,
    kicker: "Sol · 31 modelos",
    title: "Generación-A",
    text: "Estilos atrevidos y colores vibrantes que inspiran libertad.",
  },
  {
    id: "azul",
    href: links.azul,
    img: "/assets/web/hero-filtro-azul.jpg",
    alt: "Pareja leyendo un libro con anteojos de filtro azul",
    badge: "20% OFF",
    badgeAccent: true,
    kicker: "Óptico · 103 modelos",
    title: "Filtro Azul",
    text: "Lentes orgánicos con filtro azul, antirreflejo y UV. Descuento automático en el carro.",
  },
  {
    id: "lectura",
    href: links.lectura,
    img: "/assets/web/hero-lectura.jpg",
    alt: "Hombre leyendo con anteojos de lectura magnéticos",
    badge: "2x1",
    badgeAccent: true,
    kicker: "Lectura · Magnéticos",
    title: "Lectura",
    text: "Lentes orgánicos con protección UV. Cierre magnético al cuello.",
  },
  {
    id: "oferta",
    href: links.oferta,
    img: "/assets/web/banner-ofertas-hombre-sombrero.jpg",
    alt: "Hombre con sombrero y anteojos espejados frente a máquinas de chicles amarillas",
    badge: "Hasta 50%",
    kicker: "Ofertas · 40 modelos",
    title: "Descuentos hasta 50% en todas las colecciones",
  },
];

export const stats = [
  { to: 3, prefix: "", suffix: " años", label: "de garantía en cada anteojo" },
  { to: 400, prefix: "UV ", suffix: "", label: "protección real certificada" },
  { to: 250, prefix: "", suffix: "+", label: "modelos en catálogo" },
  { to: 5, prefix: "", suffix: "", label: "colecciones, envío a todo Chile" },
];

export const lookbookRowA = [
  { src: "/assets/web/ig-01.jpg", alt: "Hombre con anteojos ópticos negros" },
  { src: "/assets/web/ig-02.jpg", alt: "Mujer con anteojos carey y cuello alto" },
  { src: "/assets/web/ig-03.jpg", alt: "Mujer pelirroja con anteojos carey" },
  { src: "/assets/web/ig-05.jpg", alt: "Mujer con anteojos negros en biblioteca" },
  { src: "/assets/web/ig-06.jpg", alt: "Hombre con anteojos filtro azul en oficina" },
  { src: "/assets/web/ig-07.jpg", alt: "Hombre pelirrojo con anteojos redondos" },
];

export const lookbookRowB = [
  { src: "/assets/web/ig-08.jpg", alt: "Mujer rubia con anteojos de sol negros" },
  { src: "/assets/web/ig-09.jpg", alt: "Hombre con anteojos de sol frente al mar" },
  { src: "/assets/web/ig-10.jpg", alt: "Mujer con anteojos de sol mirando al cielo" },
  { src: "/assets/web/ig-11.jpg", alt: "Hombre en velero con anteojos de sol" },
  { src: "/assets/web/ig-12.jpg", alt: "Mujer con anteojos de sol y helado" },
  { src: "/assets/web/ig-04.jpg", alt: "Mujer con anteojos ópticos translúcidos" },
];

export const articles = [
  {
    href: `${SHOP}/blogs/news/%F0%9F%91%93-lentes-polarizadas-organicas-o-polica`,
    img: "/assets/web/blog-lentes-polarizadas.jpg",
    date: "2026-02-04",
    dateLabel: "4 feb 2026",
    category: "Anteojos de sol",
    title: "Lentes polarizadas: ¿orgánicas o policarbonato?",
  },
  {
    href: `${SHOP}/blogs/calidad-de-los-cristales-o-lentes/lo-que-nadie-te-dice`,
    img: "/assets/web/blog-lo-que-nadie-te-dice.jpg",
    date: "2026-04-10",
    dateLabel: "10 abr 2026",
    category: "Calidad de cristales",
    title: "Lo que nadie te dice sobre la calidad de los lentes",
  },
  {
    href: `${SHOP}/blogs/news/la-importancia-de-proteger-los-ojos-con-anteojos`,
    img: "/assets/web/blog-proteger-ojos.jpg",
    date: "2025-03-28",
    dateLabel: "28 mar 2025",
    category: "Salud visual",
    title: "La importancia de proteger los ojos con anteojos",
  },
  {
    href: `${SHOP}/blogs/news/beneficios-de-usar-anteojos-de-sol`,
    img: "/assets/web/blog-beneficios-sol.jpg",
    date: "2025-03-25",
    dateLabel: "25 mar 2025",
    category: "Anteojos de sol",
    title: "Beneficios de usar anteojos de sol todo el año",
  },
];

export const menuLinks = [
  { label: "Sol · LUXE", href: links.luxe },
  { label: "Generación-A", href: links.genA },
  { label: "Filtro Azul", href: links.azul },
  { label: "Lectura Magnéticos", href: links.lectura },
  { label: "Ofertas", href: links.oferta },
  { label: "Lookbook", href: links.lookbook },
  { label: "Quiénes somos", href: links.about },
  { label: "Blog", href: links.blog },
];
