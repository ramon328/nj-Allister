import { links } from "./data";

/** Minimal holding page shown in production while the redesign is reviewed. */
export default function ComingSoon() {
  return (
    <main className="soon">
      <div className="grain" aria-hidden="true" />
      <div className="soon__inner">
        <img className="soon__logo" src="/assets/web/logo-light.png" alt="Allister Eyewear" width="260" height="101" />
        <h1 className="soon__title">
          <span className="line"><span>Próximamente.</span></span>
        </h1>
        <p className="soon__text">Estamos preparando algo nuevo.</p>
        <p className="soon__links">
          <a href={links.instagram}>Instagram</a>
          <a href={links.whatsapp}>WhatsApp</a>
          <a href={links.email}>contacto@allister-eyewear.com</a>
        </p>
      </div>
    </main>
  );
}
