import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Allister Eyewear — Anteojos de sol polarizados, filtro azul y lectura", template: "%s · Allister Eyewear" },
  description: "Allister Eyewear®. Anteojos de sol polarizados con protección UV400, ópticos con filtro azul y lectura magnéticos. Envío gratis sobre $39.900 a todo Chile. 3 años de garantía.",
  openGraph: { type: "website", locale: "es_CL", siteName: "Allister Eyewear", images: ["/assets/web/og-image-1200x628.jpg"] },
  icons: { icon: "/assets/img/brand/logo-icon.webp" },
};
export const viewport: Viewport = { themeColor: "#151311", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600&f[]=satoshi@400,500,700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
