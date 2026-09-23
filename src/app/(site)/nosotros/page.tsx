import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Quiénes somos" };

export default function AboutPage() {
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container prose-grid">
          <div>
            <p className="eyebrow" data-reveal><span className="eyebrow__dot" />Quiénes somos</p>
            <h1 className="h2" data-split>Calidad que se nota.<br /><em>Estilo que perdura.</em></h1>
            <div className="prose" data-reveal-group>
              <p>Allister Eyewear® nació con una misión clara: llevar anteojos de calidad a quienes valoran el estilo, el cuidado visual y los detalles que marcan la diferencia.</p>
              <p>Somos una marca que se preocupa por la calidad, desde anteojos de sol con protección UV real hasta lentes de uso diario. En todas nuestras colecciones encontrarás materiales de alta calidad, lentes cuidadosamente seleccionados y diseños atemporales que trascienden las tendencias.</p>
              <p>Creemos que protegerse del sol o de las pantallas no debería ser un sacrificio estético ni de calidad. Por eso cada pieza Allister está pensada para acompañarte desde el día a día hasta los momentos que más importan.</p>
              <p>Somos una tienda exclusivamente online con despacho a todo Chile desde Santiago. Cada par viene con estuche, paño de limpieza y 3 años de garantía.</p>
            </div>
          </div>
          <figure className="prose-img" data-clip="circle"><Image src="/assets/web/banner-mujer-rubia-terraza.jpg" alt="Mujer sonriendo con anteojos de sol Allister" width={1600} height={1067} sizes="(max-width: 900px) 100vw, 45vw" /></figure>
        </div>
      </section>
    </main>
  );
}
