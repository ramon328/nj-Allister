import type { Metadata } from "next";
import { LEGAL_VERSION } from "@/features/orders/schemas";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container container--narrow prose">
          <p className="eyebrow"><span className="eyebrow__dot" />Legal · versión {LEGAL_VERSION}</p>
          <h1 className="h2">Términos <em>y condiciones.</em></h1>
          <h2>1. Vendedor</h2>
          <p>Allister Eyewear, Av. Sergio Viera de Mello 4524, Macul, Santiago, Chile. Tienda exclusivamente online. Contacto: contacto@allister-eyewear.com.</p>
          <h2>2. Compra y pago</h2>
          <p>Al confirmar un pedido reservamos las unidades por 48 horas. El pedido queda confirmado cuando el pago es aprobado por Mercado Pago. Los precios están en pesos chilenos e incluyen IVA. El costo de despacho se informa antes de pagar y el comprador acepta expresamente el total.</p>
          <h2>3. Despacho</h2>
          <p>Despachamos a todo Chile con los plazos indicados en la página de <a href="/envios">envíos</a>. Los plazos son estimados y dependen del transportista.</p>
          <h2 id="cambios">4. Cambios, devoluciones y garantía</h2>
          <p>Conforme a la Ley 19.496, el comprador puede retractarse dentro de 10 días desde la recepción cuando la compra se realizó por medios electrónicos, devolviendo el producto sin uso y en su empaque original. La garantía legal de 3 meses y la garantía voluntaria Allister de 3 años cubren defectos de fabricación.</p>
          <h2>5. Códigos de descuento</h2>
          <p>Los códigos son personales, no acumulables y pueden tener condiciones de compra mínima o vigencia. Allister puede desactivarlos en cualquier momento.</p>
          <h2>6. Datos personales</h2>
          <p>Tratamos los datos según la <a href="/privacidad">política de privacidad</a>, solo para gestionar la compra, el despacho y la comunicación relacionada.</p>
          <h2>7. Ley aplicable</h2>
          <p>Estos términos se rigen por la legislación chilena. Cualquier controversia se someterá a los tribunales de Santiago, sin perjuicio de los derechos del consumidor ante el SERNAC.</p>
        </div>
      </section>
    </main>
  );
}
