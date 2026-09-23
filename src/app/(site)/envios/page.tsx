import type { Metadata } from "next";
import { getSettings } from "@/features/catalog/queries";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = { title: "Envíos y cambios" };

export default async function ShippingPage() {
  const s = await getSettings();
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container container--narrow prose">
          <p className="eyebrow"><span className="eyebrow__dot" />Envíos</p>
          <h1 className="h2">Envíos <em>y cambios.</em></h1>
          <h2>Despacho</h2>
          <p>Enviamos a todo Chile desde Santiago. El despacho cuesta {formatCLP(s.shipping_clp)} y es <strong>gratis en compras desde {formatCLP(s.free_shipping_min_clp)}</strong>. El costo se muestra antes de pagar.</p>
          <p>Los pedidos pagados antes de las 14:00 (días hábiles) se preparan el mismo día. Plazos estimados: Región Metropolitana 1 a 3 días hábiles, regiones 2 a 6 días hábiles. Te avisamos por correo con el número de seguimiento cuando el pedido sale.</p>
          <h2>Cambios y devoluciones</h2>
          <p>Tienes 10 días desde la recepción para cambios por talla, modelo o color, con el producto sin uso y en su estuche original. Si el producto llega con un defecto, lo cambiamos sin costo dentro de la garantía legal.</p>
          <h2>Garantía</h2>
          <p>Todos los anteojos Allister tienen 3 años de garantía por defectos de fabricación (marco y bisagras). No cubre rayas por uso, golpes ni pérdida.</p>
          <p>Para gestionar un cambio escríbenos por WhatsApp o a contacto@allister-eyewear.com con tu número de pedido.</p>
        </div>
      </section>
    </main>
  );
}
