import datos from "./codigos-postales.json";

/**
 * Códigos postales de Chile por comuna (GeoNames, CC BY 4.0; 346 comunas).
 * Cada comuna tiene un código base; los códigos reales van desde ese base
 * hasta el base de la comuna siguiente. Se acepta un código de 7 dígitos que
 * caiga en el bloque de la comuna indicada.
 */
export type ComunaPostal = { comuna: string; region: string; provincia: string; codigo: string };

export const COMUNAS: ComunaPostal[] = datos as ComunaPostal[];
export const REGIONES = [...new Set(COMUNAS.map((c) => c.region))].sort((a, b) => a.localeCompare(b, "es"));

export const normalizarNombre = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " ");

const porNombre = new Map(COMUNAS.map((c) => [normalizarNombre(c.comuna), c]));
const BASES = [...new Set(COMUNAS.map((c) => Number(c.codigo)))].sort((a, b) => a - b);

export function rangoPostal(c: ComunaPostal): { desde: number; hasta: number } {
  const base = Number(c.codigo);
  const siguiente = BASES.find((b) => b > base);
  return { desde: base, hasta: (siguiente ?? base + 100_000) - 1 };
}

export function buscarComuna(nombre: string | null | undefined): ComunaPostal | null {
  if (!nombre) return null;
  return porNombre.get(normalizarNombre(nombre)) ?? null;
}

export function comunasDeRegion(region: string): ComunaPostal[] {
  return COMUNAS.filter((c) => c.region === region);
}

export type ResultadoPostal = { ok: true; comuna: ComunaPostal } | { ok: false; motivo: string; comuna: ComunaPostal | null };

export function validarCodigoPostal(codigo: string | null | undefined, comuna: string | null | undefined): ResultadoPostal {
  const c = buscarComuna(comuna);
  const cp = (codigo ?? "").replace(/\D/g, "");
  if (!c) return { ok: false, motivo: "Comuna no reconocida: elige una de la lista", comuna: null };
  if (cp.length === 0) return { ok: true, comuna: c };
  if (cp.length !== 7) return { ok: false, motivo: "El código postal tiene 7 dígitos", comuna: c };
  const { desde, hasta } = rangoPostal(c);
  const n = Number(cp);
  if (n < desde || n > hasta) return { ok: false, motivo: `No corresponde a ${c.comuna}: sus códigos van de ${desde} a ${hasta}`, comuna: c };
  return { ok: true, comuna: c };
}
