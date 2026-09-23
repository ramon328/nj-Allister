import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container container--narrow prose">
          <p className="eyebrow"><span className="eyebrow__dot" />Legal</p>
          <h1 className="h2">Política de <em>privacidad.</em></h1>
          <p>Allister Eyewear trata tus datos personales conforme a la Ley 19.628 y la Ley 21.719 sobre protección de datos personales.</p>
          <h2>Qué datos recogemos</h2>
          <p>Nombre, correo, teléfono y dirección de entrega al hacer un pedido; correo al suscribirte a novedades. No almacenamos datos de tarjetas: el pago lo procesa Mercado Pago en sus propios sistemas.</p>
          <h2>Para qué</h2>
          <p>Gestionar tu compra, despacho, garantía y comunicación relacionada. Solo enviamos promociones si aceptaste recibirlas, y puedes darte de baja cuando quieras.</p>
          <h2>Con quién se comparten</h2>
          <p>Mercado Pago (pago), la empresa de transporte (despacho) y los proveedores técnicos que alojan la tienda (Vercel, Supabase). Nunca vendemos datos.</p>
          <h2>Tus derechos</h2>
          <p>Puedes pedir acceso, rectificación o eliminación de tus datos escribiendo a contacto@allister-eyewear.com. Conservamos los datos de pedidos el tiempo exigido por la normativa tributaria.</p>
          <h2>Cookies</h2>
          <p>Usamos solo cookies técnicas: el carro se guarda en tu navegador y el acceso al pedido usa una cookie de sesión. No usamos cookies publicitarias de terceros.</p>
        </div>
      </section>
    </main>
  );
}
