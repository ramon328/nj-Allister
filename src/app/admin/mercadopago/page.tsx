import { mpAccount, mpConfigured, mpSearchPayments } from "@/lib/payments/mercadopago";
import { formatCLP, formatDateTime } from "@/lib/format";
import { publicEnv } from "@/lib/env";

export default async function MercadoPagoPage() {
  const configured = mpConfigured();
  const [account, payments] = configured ? await Promise.all([mpAccount(), mpSearchPayments({ limit: 50, days: 60 })]) : [null, null];
  return (
    <div className="stack">
      <h1 className="h2">Mercado Pago</h1>
      {!configured ? (
        <div className="banner banner--warn">
          <p><strong>Falta configurar.</strong> Pasos:</p>
          <ol>
            <li>Crea una aplicación en <a href="https://www.mercadopago.cl/developers/panel/app" className="link-underline" target="_blank" rel="noopener">mercadopago.cl/developers</a> (tipo Checkout Pro).</li>
            <li>Copia el <em>Access Token</em> de producción en la variable <code>MP_ACCESS_TOKEN</code> (Vercel → Settings → Environment Variables).</li>
            <li>En Webhooks configura la URL <code>{publicEnv.siteUrl}/api/webhooks/mercadopago</code> con el evento <em>Pagos</em>, y copia la clave secreta en <code>MP_WEBHOOK_SECRET</code>.</li>
            <li>Vuelve a desplegar. Esta página mostrará la cuenta y los pagos.</li>
          </ol>
        </div>
      ) : null}
      {account ? <div className="kpis"><div className="kpi"><span>Cuenta</span><strong>{account.nickname}</strong><small>{account.email} · {account.site_id}{account.nickname.startsWith("TEST") ? " · credenciales de prueba" : ""}</small></div><div className="kpi"><span>Webhook</span><strong>{process.env.MP_WEBHOOK_SECRET ? "Firma configurada" : "Sin clave secreta"}</strong><small>{publicEnv.siteUrl}/api/webhooks/mercadopago</small></div></div> : null}
      {payments ? (
        <table className="atable">
          <thead><tr><th>Pago</th><th>Fecha</th><th>Estado</th><th>Monto</th><th>Medio</th><th>Pedido</th></tr></thead>
          <tbody>
            {payments.results.map((p) => (
              <tr key={p.id}><td>{p.id}</td><td>{formatDateTime(p.date_created)}</td><td>{p.status}{p.status_detail ? ` · ${p.status_detail}` : ""}</td><td>{formatCLP(p.transaction_amount)}</td><td>{p.payment_method_id}{p.installments && p.installments > 1 ? ` · ${p.installments} cuotas` : ""}</td><td>{p.external_reference ? <a href={`/admin/pedidos/${p.external_reference}`} className="link-underline">ver</a> : "—"}</td></tr>
            ))}
            {payments.results.length === 0 ? <tr><td colSpan={6} className="muted">Sin pagos en los últimos 60 días.</td></tr> : null}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
