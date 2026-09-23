const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
export const formatCLP = (n: number) => clp.format(n);

const dt = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" });
export const formatDateTime = (iso: string) => dt.format(new Date(iso));

const d = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });
export const formatDate = (iso: string) => d.format(new Date(iso));

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);

export const pctOff = (price: number, compare: number | null) => (compare && compare > price ? Math.round((1 - price / compare) * 100) : 0);

export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
