import nodemailer from "nodemailer";

export function mailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_PASS !== "YOUR_SMTP_APP_PASSWORD",
  );
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!mailConfigured()) {
    console.warn("[mail] SMTP not configured — skip send:", opts.subject);
    return { ok: false, skipped: true };
  }
  try {
    const rawFrom = (process.env.SMTP_FROM || "").trim();
    const from =
      rawFrom.includes("@") && rawFrom.includes("<")
        ? rawFrom
        : rawFrom.includes("@")
          ? `"Arin's Study Diary" <${rawFrom}>`
          : `"Arin's Study Diary" <diary@neamulkabiremon.com>`;
    await transporter().sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    console.error("[mail] send error:", message);
    return { ok: false, error: message };
  }
}

export function arinEmail(): string {
  return (process.env.ARIN_EMAIL || "").toLowerCase();
}

export function emonEmail(): string {
  return (process.env.EMON_EMAIL || "").toLowerCase();
}
