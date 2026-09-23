export default function NotFound() {
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container container--narrow empty">
          <p className="eyebrow"><span className="eyebrow__dot" />404</p>
          <h1 className="h2">Esta página <em>no existe.</em></h1>
          <p className="muted">El enlace puede estar mal escrito o el producto ya no está disponible.</p>
          <a href="/coleccion" className="link-underline">Ver la colección</a>
        </div>
      </section>
    </main>
  );
}
