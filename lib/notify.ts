import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { siteUrl, adminUrl } from "@/lib/urls";
import { displayUserName, formatNaira, maskName } from "@/lib/format";
import { EARNING_HOLD_DAYS } from "@/lib/pricing";
import { createVerificationToken } from "@/lib/emailVerification";

/**
 * Every notification the app sends. Each function takes ids, looks up what
 * it needs, and swallows its own errors, so callers can simply `await` it.
 *
 * ESSENTIAL emails always send (decisions, money, security).
 * OPTIONAL emails respect the user's "email notifications" setting.
 * Message emails never contain the message text, only who it is from.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Content = { heading: string; lines: string[]; cta?: { label: string; url: string }; optional?: boolean };

function render(c: Content) {
  const footer = c.optional
    ? `<p style="margin:20px 0 0;font-size:12px;color:#737373">You can turn these emails off any time on your <a href="${siteUrl()}/profile" style="color:#0c7f57">profile page</a>.</p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#faf9f7;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#171717">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e5e5;border-radius:16px"><tr><td style="padding:28px">
<p style="margin:0 0 20px;font-size:20px;font-weight:700">bed<span style="color:#0c7f57">listing</span></p>
<h1 style="margin:0 0 14px;font-size:18px">${esc(c.heading)}</h1>
${c.lines.map((l) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#404040">${esc(l)}</p>`).join("\n")}
${c.cta ? `<p style="margin:20px 0 0"><a href="${c.cta.url}" style="display:inline-block;background:#0c7f57;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:999px">${esc(c.cta.label)}</a></p>` : ""}
${footer}
</td></tr></table></td></tr></table></body></html>`;
  const text = [c.heading, "", ...c.lines, ...(c.cta ? ["", `${c.cta.label}: ${c.cta.url}`] : []), ...(c.optional ? ["", `Turn these emails off: ${siteUrl()}/profile`] : [])].join("\n");
  return { html, text };
}

async function send(to: string | string[], subject: string, c: Content) {
  const { html, text } = render(c);
  await sendEmail({ to, subject, html, text });
}

/** Wrap every notifier so an email problem can never surface to the caller. */
function safe<A extends unknown[]>(fn: (...a: A) => Promise<void>) {
  return async (...a: A) => {
    try {
      await fn(...a);
    } catch (err) {
      console.error("Notification error:", err);
    }
  };
}

const userBase = (role: string) => (role === "ADMIN" ? adminUrl() : siteUrl());

/** True at most once per `minutes` for this user and key. */
async function throttle(userId: string, key: string, minutes: number) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  const recent = await prisma.notificationLog.findFirst({ where: { userId, key, createdAt: { gte: since } } });
  if (recent) return false;
  await prisma.notificationLog.create({ data: { userId, key } });
  return true;
}

async function adminEmails(): Promise<string[]> {
  const fromEnv = (process.env.ADMIN_NOTIFY_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (fromEnv.length) return fromEnv;
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { email: true } });
  return admins.map((a) => a.email);
}

// ───────────────────────── to the team ─────────────────────────

/** Tells the admin team something needs attention. */
export const notifyAdmins = safe(async (subject: string, line: string, path: string) => {
  const to = await adminEmails();
  if (!to.length) return;
  await send(to, `[bedlisting admin] ${subject}`, {
    heading: subject,
    lines: [line],
    cta: { label: "Open in admin", url: `${adminUrl()}${path}` },
  });
});

// ───────────────────────── messages (optional) ─────────────────────────

export const notifyNewMessage = safe(async (a: { propertyId: string; senderId: string; receiverId: string }) => {
  const [receiver, sender, property] = await Promise.all([
    prisma.user.findUnique({ where: { id: a.receiverId }, select: { email: true, role: true, emailNotifications: true } }),
    prisma.user.findUnique({ where: { id: a.senderId }, select: { name: true, role: true } }),
    prisma.property.findUnique({ where: { id: a.propertyId }, select: { title: true, landlordId: true } }),
  ]);
  if (!receiver || !sender || !property || !receiver.emailNotifications) return;
  if (!(await throttle(a.receiverId, `msg:${a.propertyId}:${a.senderId}`, 15))) return;

  const isLister = a.receiverId === property.landlordId;
  const base = userBase(receiver.role);
  const path = receiver.role === "ADMIN" ? "/admin/messages" : "/messages";
  const url = `${base}${path}/${a.propertyId}${isLister ? `?with=${a.senderId}` : ""}`;

  await send(receiver.email, `New message about "${property.title}"`, {
    heading: "You have a new message",
    lines: [`${displayUserName(sender)} sent you a message about "${property.title}".`],
    cta: { label: "Read and reply", url },
    optional: true,
  });
});

// ───────────────────────── listings (essential) ─────────────────────────

export const notifyListingDecision = safe(async (propertyId: string, decision: "APPROVED" | "REJECTED") => {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { title: true, landlord: { select: { email: true, role: true } } },
  });
  if (!p || p.landlord.role === "ADMIN") return;

  if (decision === "APPROVED") {
    await send(p.landlord.email, `Your listing is live: ${p.title}`, {
      heading: "Your listing is live",
      lines: [`"${p.title}" has been approved and people can now find it on bedlisting.`, "You earn when people unlock it, and you can feature it from your dashboard to get seen first."],
      cta: { label: "Go to my dashboard", url: `${siteUrl()}/landlord/dashboard` },
    });
  } else {
    await send(p.landlord.email, `Your listing needs changes: ${p.title}`, {
      heading: "Your listing was not approved",
      lines: [`"${p.title}" was not approved. This usually means the photos, details or ownership proof could not be confirmed.`, "Open it from your dashboard, fix it and save to send it for review again."],
      cta: { label: "Edit my listing", url: `${siteUrl()}/landlord/dashboard` },
    });
  }
});

/** A listing was removed as fake or misleading: tell the lister, and everyone refunded. */
export const notifyListingRemoved = safe(async (propertyId: string, refundedUserIds: string[]) => {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { title: true, landlord: { select: { email: true, role: true } } },
  });
  if (!p) return;

  if (p.landlord.role !== "ADMIN") {
    await send(p.landlord.email, `Your listing was removed: ${p.title}`, {
      heading: "Your listing was removed",
      lines: [`"${p.title}" was removed because it did not meet bedlisting's standards. Earnings from it that had not been paid out were cancelled.`, "If you think this is a mistake, reply to this email or contact support."],
    });
  }

  const users = await prisma.user.findMany({ where: { id: { in: refundedUserIds } }, select: { email: true } });
  for (const u of users) {
    await send(u.email, `Your bedcoins were returned: ${p.title}`, {
      heading: "A listing you unlocked was removed",
      lines: [`"${p.title}" was removed by bedlisting. The bedcoins you spent on it have been returned to your balance.`],
      cta: { label: "See my bedcoins", url: `${siteUrl()}/credits` },
    });
  }
});

// ───────────────────────── verification (essential) ─────────────────────────

/** The "confirm your email address" link. Also used by the Resend button. */
export const notifyVerifyEmail = safe(async (userId: string) => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!u || u.emailVerified) return;
  const token = await createVerificationToken(userId);
  const link = `${siteUrl()}/verify-email?token=${token}`;
  // No email key (local development): print the link so you can still click it.
  if (!process.env.RESEND_API_KEY) console.log(`[dev] Confirm-email link for ${u.email}: ${link}`);
  await send(u.email, "Confirm your email address", {
    heading: "Confirm your email address",
    lines: ["Tap the button to confirm this is your email. The link works for 24 hours.", "If you did not create a bedlisting account, you can ignore this email."],
    cta: { label: "Confirm my email", url: link },
  });
});

export const notifyVerificationResult = safe(async (userId: string, decision: "APPROVED" | "REJECTED") => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, role: true } });
  if (!u) return;
  if (decision === "APPROVED") {
    await send(u.email, "You are verified on bedlisting", {
      heading: "Your ID was approved",
      lines: ["You now have the verified check mark, and you can list properties and withdraw your earnings."],
      cta: { label: "Add a property", url: `${siteUrl()}/landlord/properties/new` },
    });
  } else {
    await send(u.email, "Your ID could not be verified", {
      heading: "Your ID was not approved",
      lines: ["We could not confirm your identity from the document you sent. Make sure the photo is clear, uncropped and the name matches your account, then submit it again."],
      cta: { label: "Submit ID again", url: `${siteUrl()}/landlord/verification` },
    });
  }
});

// ───────────────────────── money (essential) ─────────────────────────

export const notifyPurchase = safe(async (paymentId: string) => {
  const p = await prisma.payment.findUnique({ where: { id: paymentId }, include: { user: { select: { email: true, creditBalance: true, bonusBalance: true } } } });
  if (!p) return;
  await send(p.user.email, `Receipt: ${p.credits} bedcoins added`, {
    heading: "Payment received",
    lines: [`We received ${formatNaira(p.amountKobo)} and added ${p.credits} bedcoins to your account.`, `Your balance is now ${p.user.creditBalance + p.user.bonusBalance} bedcoins.`, `Reference: ${p.reference}`],
    cta: { label: "See my bedcoins", url: `${siteUrl()}/credits` },
  });
});

export const notifyPayoutResult = safe(async (payoutId: string, result: "PAID" | "REJECTED") => {
  const p = await prisma.payoutRequest.findUnique({ where: { id: payoutId }, include: { user: { select: { email: true } } } });
  if (!p) return;
  if (result === "PAID") {
    await send(p.user.email, `Your withdrawal of ${formatNaira(p.amountKobo)} was paid`, {
      heading: "Your withdrawal was paid",
      lines: [`${formatNaira(p.amountKobo)} was sent to ${p.bankName}, account ending ${p.accountNumber.slice(-4)}.`, ...(p.reference ? [`Transfer reference: ${p.reference}`] : [])],
    });
  } else {
    await send(p.user.email, "Your withdrawal request was not approved", {
      heading: "Your withdrawal was not approved",
      lines: ["The money is back in your available earnings.", ...(p.adminNote ? [`Note from the team: ${p.adminNote}`] : []), "You can check your bank details and request again."],
      cta: { label: "Open my earnings", url: `${siteUrl()}/landlord/earnings` },
    });
  }
});

export const notifyPasswordChanged = safe(async (userId: string) => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, role: true } });
  if (!u) return;
  await send(u.email, "Your bedlisting password was changed", {
    heading: "Your password was changed",
    lines: ["If this was you, there is nothing to do. If it was not, contact support immediately."],
  });
});

// ───────────────────────── earnings and escorts (optional) ─────────────────────────

export const notifyEarning = safe(async (ownerId: string, propertyId: string, amountKobo: number) => {
  const [owner, p] = await Promise.all([
    prisma.user.findUnique({ where: { id: ownerId }, select: { email: true, emailNotifications: true } }),
    prisma.property.findUnique({ where: { id: propertyId }, select: { title: true } }),
  ]);
  if (!owner || !p || !owner.emailNotifications || amountKobo <= 0) return;
  await send(owner.email, `You earned ${formatNaira(amountKobo)}`, {
    heading: `You earned ${formatNaira(amountKobo)}`,
    lines: [`Someone unlocked "${p.title}". The money is held for ${EARNING_HOLD_DAYS} days and then becomes available to withdraw.`],
    cta: { label: "See my earnings", url: `${siteUrl()}/landlord/earnings` },
    optional: true,
  });
});

export const notifyEscort = safe(
  async (kind: "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED" | "EXPIRED", escortId: string) => {
    const e = await prisma.escortRequest.findUnique({
      where: { id: escortId },
      include: {
        property: { select: { title: true } },
        seeker: { select: { email: true, name: true, role: true, emailNotifications: true } },
        lister: { select: { email: true, role: true, emailNotifications: true } },
      },
    });
    if (!e) return;
    const title = e.property.title;

    // Who gets told, and what.
    const toLister = kind === "REQUESTED" || kind === "CANCELLED" || kind === "COMPLETED";
    const target = toLister ? e.lister : e.seeker;
    if (!target.emailNotifications) return;

    const copy: Record<typeof kind, { heading: string; line: string }> = {
      REQUESTED: { heading: "New escort request", line: `${displayUserName(e.seeker)} wants you to take them to "${title}" (${e.preferredTime}). Accept or decline within 3 days.` },
      ACCEPTED: { heading: "Your escort was accepted", line: `The agent accepted your request for "${title}". Mark the visit complete in the app afterwards.` },
      DECLINED: { heading: "Your escort was declined", line: `The agent could not take you to "${title}". Your bedcoins were returned.` },
      CANCELLED: { heading: "An escort request was cancelled", line: `The request for "${title}" was cancelled by the seeker.` },
      COMPLETED: { heading: "Visit confirmed", line: `The seeker confirmed the visit to "${title}". Your earning is now being held for the standard period.` },
      EXPIRED: { heading: "Your escort request expired", line: `The agent did not answer your request for "${title}" in time. Your bedcoins were returned.` },
    };
    const url = toLister ? `${userBase(e.lister.role)}/landlord/escorts` : `${siteUrl()}/properties/${e.propertyId}`;
    await send(target.email, copy[kind].heading, { heading: copy[kind].heading, lines: [copy[kind].line], cta: { label: "Open", url }, optional: true });
  }
);

// ───────────────────────── roommates (optional) ─────────────────────────

export const notifyRoommate = safe(
  async (kind: "REQUESTED" | "ACCEPTED" | "DECLINED" | "EXPIRED", connectionId: string) => {
    const c = await prisma.roommateConnection.findUnique({
      where: { id: connectionId },
      include: {
        requester: { select: { name: true, email: true, emailNotifications: true } },
        target: { select: { name: true, email: true, emailNotifications: true } },
      },
    });
    if (!c) return;

    const toTarget = kind === "REQUESTED";
    const recipient = toTarget ? c.target : c.requester;
    if (!recipient.emailNotifications) return;

    const copy = {
      REQUESTED: { heading: "New roommate request", line: `${maskName(c.requester.name)} would like to connect as a possible roommate.` },
      ACCEPTED: { heading: "Your roommate request was accepted", line: `${maskName(c.target.name)} accepted. You can chat now.` },
      DECLINED: { heading: "Your roommate request was declined", line: `${maskName(c.target.name)} did not accept this time. Your bedcoins were returned.` },
      EXPIRED: { heading: "Your roommate request expired", line: "It was not answered in time. Your bedcoins were returned." },
    }[kind];
    await send(recipient.email, copy.heading, {
      heading: copy.heading,
      lines: [copy.line],
      cta: { label: "Open Roommates", url: `${siteUrl()}/roommates/connections${kind === "ACCEPTED" ? `/${c.id}` : ""}` },
      optional: true,
    });
  }
);

export const notifyRoommateMessage = safe(async (connectionId: string, senderId: string) => {
  const c = await prisma.roommateConnection.findUnique({
    where: { id: connectionId },
    include: {
      requester: { select: { id: true, name: true, email: true, emailNotifications: true } },
      target: { select: { id: true, name: true, email: true, emailNotifications: true } },
    },
  });
  if (!c) return;
  const sender = c.requesterId === senderId ? c.requester : c.target;
  const recipient = c.requesterId === senderId ? c.target : c.requester;
  if (!recipient.emailNotifications) return;
  if (!(await throttle(recipient.id, `rmmsg:${connectionId}`, 15))) return;

  await send(recipient.email, "New message from a possible roommate", {
    heading: "You have a new message",
    lines: [`${maskName(sender.name)} sent you a message.`],
    cta: { label: "Read and reply", url: `${siteUrl()}/roommates/connections/${connectionId}` },
    optional: true,
  });
});
