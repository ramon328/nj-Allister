"use client";
import { useState } from "react";
import Image from "next/image";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) return <div className="gallery"><div className="gallery__main gallery__ph" /></div>;
  return (
    <div className="gallery">
      <figure className="gallery__main" data-cursor="Zoom">
        <Image key={images[i]} src={images[i]} alt={`${name}, vista ${i + 1}`} width={1200} height={1200} sizes="(max-width: 900px) 100vw, 55vw" priority className="gallery__img" />
      </figure>
      {images.length > 1 ? (
        <div className="gallery__thumbs" role="tablist" aria-label="Fotos">
          {images.map((src, n) => (
            <button key={src} type="button" role="tab" aria-selected={n === i} className={`gallery__thumb ${n === i ? "is-on" : ""}`} onClick={() => setI(n)}>
              <Image src={src} alt="" width={160} height={160} sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
