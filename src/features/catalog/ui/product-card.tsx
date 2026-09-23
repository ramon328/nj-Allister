import Image from "next/image";
import { formatCLP, pctOff } from "@/lib/format";
import type { ProductCard as Card } from "../queries";

const KIND: Record<string, string> = { sol: "Sol", optico: "Óptico", lectura: "Lectura" };

export function ProductCard({ p, priority = false }: { p: Card; priority?: boolean }) {
  const off = pctOff(p.price_clp, p.compare_price_clp);
  const hover = p.gallery_images?.[0];
  return (
    <a href={`/lentes/${p.slug}`} className="pcard" data-cursor="Ver">
      <figure className="pcard__media">
        {p.image_url ? <Image src={p.image_url} alt={p.name} width={640} height={640} sizes="(max-width: 768px) 50vw, 25vw" priority={priority} className="pcard__img" /> : <span className="pcard__ph" />}
        {hover ? <Image src={hover} alt="" width={640} height={640} sizes="(max-width: 768px) 50vw, 25vw" className="pcard__img pcard__img--alt" aria-hidden="true" /> : null}
        {off > 0 ? <span className="badge badge--accent">−{off}%</span> : null}
        {p.stock <= 0 ? <span className="badge">Agotado</span> : null}
      </figure>
      <div className="pcard__body">
        <p className="pcard__kicker">{KIND[p.kind]}{p.color_label ? ` · ${p.color_label}` : ""}</p>
        <h3 className="pcard__name">{p.name}</h3>
        <p className="pcard__price">
          <span>{formatCLP(p.price_clp)}</span>
          {p.compare_price_clp ? <s>{formatCLP(p.compare_price_clp)}</s> : null}
        </p>
      </div>
    </a>
  );
}
