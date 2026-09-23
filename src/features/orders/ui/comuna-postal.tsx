"use client";
import { useId, useMemo, useState } from "react";
import { Field, Input, Select } from "@/components/ui";
import { COMUNAS, REGIONES, buscarComuna, rangoPostal, validarCodigoPostal } from "@/lib/postal";

/**
 * Comuna + ciudad + región + código postal con la lista oficial (346 comunas).
 * Al reconocer la comuna se fija la región y se propone el código postal base.
 */
export function ComunaPostal({ defaults, errors }: {
  defaults?: Record<string, string | undefined>;
  errors: Partial<Record<"comuna" | "city" | "region" | "postal_code", string>>;
}) {
  const listId = useId();
  const [comuna, setComuna] = useState(defaults?.comuna ?? "");
  const [region, setRegion] = useState(defaults?.region ?? "Metropolitana de Santiago");
  const [postal, setPostal] = useState(defaults?.postal_code ?? "");
  const [propuesto, setPropuesto] = useState(false);
  const encontrada = useMemo(() => buscarComuna(comuna), [comuna]);
  const estado = useMemo(() => (postal ? validarCodigoPostal(postal, comuna) : null), [postal, comuna]);

  function cambiarComuna(valor: string) {
    setComuna(valor);
    const c = buscarComuna(valor);
    if (!c) return;
    setRegion(c.region);
    if (!postal || propuesto) { setPostal(c.codigo); setPropuesto(true); }
  }
  const errorPostal = errors.postal_code ?? (postal.length === 7 && estado && !estado.ok ? estado.motivo : undefined);
  const hintPostal = encontrada ? `Opcional. ${encontrada.comuna}: códigos de ${rangoPostal(encontrada).desde} a ${rangoPostal(encontrada).hasta}` : "Opcional. Lo encuentras en correos.cl.";

  return (
    <>
      <div className="grid-2">
        <Field label="Comuna" name="comuna" error={errors.comuna}>
          <Input name="comuna" list={listId} value={comuna} onChange={(e) => cambiarComuna(e.target.value)} autoComplete="address-level2" required error={errors.comuna} />
          <datalist id={listId}>{COMUNAS.map((c) => <option key={c.comuna + c.region} value={c.comuna} />)}</datalist>
        </Field>
        <Field label="Ciudad" name="city" error={errors.city}>
          <Input name="city" defaultValue={defaults?.city ?? ""} autoComplete="address-level2" required error={errors.city} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Región" name="region" error={errors.region}>
          <Select name="region" value={region} onChange={(e) => setRegion(e.target.value)} required error={errors.region}>
            {REGIONES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Código postal" name="postal_code" hint={errorPostal ? undefined : hintPostal} error={errorPostal}>
          <Input name="postal_code" value={postal} onChange={(e) => { setPostal(e.target.value.replace(/\D/g, "").slice(0, 7)); setPropuesto(false); }} inputMode="numeric" autoComplete="postal-code" placeholder="7500000" error={errorPostal} />
        </Field>
      </div>
    </>
  );
}
