/**
 * Sends one email through Resend (https://resend.com), using plain fetch.
 * Without RESEND_API_KEY it only logs, so development works with no setup.
 * It never throws: a failed email must never break the action that caused it.
 */
export async function sendEmail(args: { to: string | string[]; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = Array.isArray(args.to) ? args.to : [args.to];
  if (to.length === 0) return false;

  if (!key) {
    console.log(`[email not sent: RESEND_API_KEY missing] to=${to.join(",")} subject="${args.subject}"`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "bedlisting <onboarding@resend.dev>",
        to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.error("Email failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
}
