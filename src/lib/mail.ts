import "server-only";

/**
 * Correo transaccional vía Resend (API HTTP, sin SDK). Solo desde el servidor.
 * Sin RESEND_API_KEY no envía y devuelve { sent: false }: la tienda sigue
 * funcionando, solo sin correos.
 */
export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export type SendResult = { sent: boolean; id?: string; motivo?: string };

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; replyTo?: string; idempotencyKey?: string }): Promise<SendResult> {
  if (!mailConfigured()) return { sent: false, motivo: "sin RESEND_API_KEY" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(opts.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text, reply_to: opts.replyTo ?? process.env.MAIL_NOTIFY }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!res.ok) {
      console.error("[mail] fallo", res.status, data?.message);
      return { sent: false, motivo: data?.message ?? `HTTP ${res.status}` };
    }
    return { sent: true, id: data?.id };
  } catch (e) {
    console.error("[mail]", e);
    return { sent: false, motivo: e instanceof Error ? e.message : "error" };
  }
}
