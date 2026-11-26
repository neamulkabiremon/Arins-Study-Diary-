import type { DayQuote } from "./quotes.js";
import { formatClock } from "./parse-task-time.js";

const BRAND = {
  bg: "#f6f0fa",
  card: "#ffffff",
  ink: "#2a2433",
  muted: "#6b5f7a",
  soft: "#8a7f96",
  lavender: "#7d5ba6",
  lavenderDeep: "#5b3d82",
  blush: "#f3ebf9",
  cream: "#fff8f1",
  border: "#e8dcf3",
  accent: "#c4a0e8",
};

function wrap(body: string, footerNote?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Arin's Study Diary</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${BRAND.card};border-radius:28px;border:1px solid ${BRAND.border};overflow:hidden;box-shadow:0 12px 40px rgba(93,61,130,0.08);">
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#c4a0e8,#f0b7d0,#ffe0b5);"></td>
          </tr>
          <tr>
            <td style="padding:32px 28px 12px;font-family:Georgia,'Times New Roman',serif;color:${BRAND.ink};">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.soft};">
                ${footerNote || "Arin's Study Diary · soft nudges, not nagging"}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type ReminderTone = {
  subject: (short: string) => string;
  greeting: string;
  hook: string;
  cta: string;
};

const SUBJECT_POOL: ReminderTone[] = [
  {
    subject: (t) => `psst… ${t} in 15 min`,
    greeting: "Hey you,",
    hook: "Your streak of showing up is cute. Don't ghost this block.",
    cta: "Open the diary, take the first tiny step, and the rest gets easier.",
  },
  {
    subject: (t) => `owl energy: ${t} starts soon`,
    greeting: "Arin,",
    hook: "Duolingo would be screaming. We're softer — but still serious about you winning today.",
    cta: "Fifteen minutes from now, you're in. Future-you already knows.",
  },
  {
    subject: (t) => `don't leave ${t} hanging`,
    greeting: "Smart cookie,",
    hook: "This is your gentle poke. Not a guilt trip. Just a warm little alarm.",
    cta: "Sit down, start the Frog if it's that one, and go.",
  },
  {
    subject: (t) => `15-min heads-up · ${t}`,
    greeting: "Hey Arin,",
    hook: "Your checklist is waiting — and it looks good on you.",
    cta: "Water, notebook, timer. You've done harder days than this.",
  },
  {
    subject: (t) => `${t} · your move`,
    greeting: "Okay legend,",
    hook: "Emon is quietly rooting. The diary is louder. Time to shine a little.",
    cta: "Show up for the first five minutes. Momentum will do the rest.",
  },
];

function subjectHint(title: string): ReminderTone {
  const t = title.toLowerCase();
  if (t.includes("math") || t.includes("maths")) {
    return {
      subject: (s) => `numbers calling · ${s} in 15`,
      greeting: "Math girl,",
      hook: "Equations don't solve themselves — but you kind of do.",
      cta: "Open the first problem. Tiny win → big streak.",
    };
  }
  if (t.includes("physics")) {
    return {
      subject: (s) => `physics check-in · ${s}`,
      greeting: "Force of nature,",
      hook: "Inertia wants the couch. You want the marks. Guess who wins.",
      cta: "One formula. One diagram. Then you're flying.",
    };
  }
  if (t.includes("chem")) {
    return {
      subject: (s) => `chem vibes in 15 · ${s}`,
      greeting: "Lab queen,",
      hook: "Reactions take heat. So do HSC scores. You're the catalyst.",
      cta: "Flash the notes, then dive into the hard bit first.",
    };
  }
  if (t.includes("bio")) {
    return {
      subject: (s) => `bio revision ping · ${s}`,
      greeting: "Life-science legend,",
      hook: "Cells multiply. So can your confidence — if you revise now.",
      cta: "Quick pass on the weak chapter. That's the whole game.",
    };
  }
  if (t.includes("language") || t.includes("english") || t.includes("bangla")) {
    return {
      subject: (s) => `language practice · ${s}`,
      greeting: "Word wizard,",
      hook: "Short block, high payoff. This is the easy win of the evening.",
      cta: "Read aloud once. Write one paragraph. Done feels good.",
    };
  }
  return SUBJECT_POOL[Math.floor(Math.random() * SUBJECT_POOL.length)]!;
}

function displayTitle(title: string): { subjectLine: string; headline: string } {
  // Prefer the subject name before the time range for cleaner copy
  const m = title.match(/^(.+?)\s+(\d{1,2}:\d{2}\s*(?:to|–|-|→).+)$/i);
  if (m) {
    return { subjectLine: m[1]!.trim(), headline: title };
  }
  return { subjectLine: title, headline: title };
}

function quoteBlockHtml(quote: DayQuote) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;background:linear-gradient(135deg,#f3eaf8,#fff8f2);border-radius:20px;border:1px solid ${BRAND.border};">
    <tr><td style="padding:18px;">
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.lavender};">Today’s quote</p>
      <p style="margin:0;font-size:17px;line-height:1.45;font-style:italic;color:${BRAND.ink};">“${escapeHtml(quote.text)}”</p>
      <p style="margin:10px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:600;color:${BRAND.lavenderDeep};">${escapeHtml(quote.source)}</p>
      <p style="margin:10px 0 0;font-size:14px;line-height:1.45;color:${BRAND.muted};">${escapeHtml(quote.action)}</p>
    </td></tr>
  </table>`;
}

export function taskReminderEmail(opts: {
  taskTitle: string;
  startMinutes: number;
  firstFive?: string | null;
  tags?: string[];
  quote?: DayQuote | null;
}) {
  const { subjectLine, headline } = displayTitle(opts.taskTitle);
  const short =
    subjectLine.length > 40 ? subjectLine.slice(0, 37) + "…" : subjectLine;
  const tone = subjectHint(opts.taskTitle);
  const subject = tone.subject(short);
  const clock = formatClock(opts.startMinutes);
  const tags = (opts.tags ?? []).filter(Boolean);
  const tagHtml = tags.length
    ? tags
        .map(
          (t) =>
            `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:999px;background:${BRAND.blush};color:${BRAND.lavenderDeep};font-size:11px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-weight:600;letter-spacing:0.02em;">${escapeHtml(t)}</span>`,
        )
        .join("")
    : "";

  const quoteText = opts.quote
    ? `\nToday’s quote:\n“${opts.quote.text}”\n— ${opts.quote.source}\n${opts.quote.action}\n`
    : "";

  const text = `${tone.greeting}

${tone.hook}

In about 15 minutes: ${opts.taskTitle}
Starts ~ ${clock}
${tags.length ? tags.map((t) => "#" + t).join(" ") + "\n" : ""}${
    opts.firstFive ? `\nTiny first step: ${opts.firstFive}\n` : ""
  }${quoteText}
${tone.cta}

— your Study Diary (and Emon, quietly rooting)`;

  const html = wrap(
    `
    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.lavender};">
      Soft reminder · 15 min
    </p>
    <p style="margin:0 0 10px;font-size:16px;color:${BRAND.muted};">${escapeHtml(tone.greeting)}</p>
    <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;font-weight:700;color:${BRAND.ink};">
      ${escapeHtml(subjectLine)}
    </h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:${BRAND.muted};">
      ${escapeHtml(tone.hook)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border-radius:20px;border:1px solid ${BRAND.border};">
      <tr>
        <td style="padding:18px 18px 14px;">
          <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.lavender};">
            Up next
          </p>
          <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:${BRAND.ink};">
            ${escapeHtml(headline)}
          </p>
          <p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:${BRAND.muted};">
            Starts around <strong style="color:${BRAND.lavenderDeep};">${clock}</strong>
            &nbsp;·&nbsp; reminder for <strong>Arin</strong>
          </p>
          ${tagHtml ? `<div style="margin-top:4px;">${tagHtml}</div>` : ""}
        </td>
      </tr>
    </table>
    ${
      opts.firstFive
        ? `<p style="margin:16px 0 0;padding:14px 16px;background:${BRAND.blush};border-radius:16px;font-size:15px;line-height:1.45;color:${BRAND.ink};">
            <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.lavender};display:block;margin-bottom:6px;">Tiny first step</span>
            ${escapeHtml(opts.firstFive)}
          </p>`
        : ""
    }
    ${opts.quote ? quoteBlockHtml(opts.quote) : ""}
    <p style="margin:20px 0 0;font-size:16px;line-height:1.55;color:${BRAND.ink};">
      ${escapeHtml(tone.cta)}
    </p>
    <p style="margin:22px 0 0;padding:14px 16px;border-radius:16px;background:${BRAND.blush};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${BRAND.lavenderDeep};font-weight:600;">
      You've got this. Emon believes it too.
    </p>
  `,
    "Arin's Study Diary · Duolingo energy, study edition",
  );

  return { subject, text, html };
}

/** Sent to Arin when she locks tomorrow — confirms 15-min nudges are armed. */
export function planArmedEmail(opts: {
  planDate: string;
  tasks: Array<{ title: string; tags: string[]; isFrog: boolean }>;
  reminderLines: Array<{ title: string; remindClock: string; startClock: string }>;
  quote: DayQuote;
}) {
  const subject = `You’re set · nudges armed for ${opts.planDate}`;
  const scheduleText = opts.reminderLines
    .map((r) => `• ${r.title}\n  mail ~ ${r.remindClock} (starts ${r.startClock})`)
    .join("\n");
  const text = `Hey Arin —

Your plan for ${opts.planDate} is locked. I’ll email you ~15 minutes before each timed block — soft Duolingo energy, study edition.

Schedule:
${scheduleText || "(no clock times found in titles — add times like “Math 3:00 to 5:20” so I can nudge you)"}

Today’s quote for that day:
“${opts.quote.text}”
— ${opts.quote.source}
${opts.quote.action}

Go gently. You’ve got this.

— your Study Diary`;

  const scheduleHtml = opts.reminderLines.length
    ? opts.reminderLines
        .map(
          (r) =>
            `<tr><td style="padding:0 0 8px;">
              <table width="100%" style="background:${BRAND.cream};border-radius:14px;border:1px solid ${BRAND.border};"><tr><td style="padding:12px 14px;">
                <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.ink};">${escapeHtml(r.title)}</p>
                <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${BRAND.muted};">
                  Mail around <strong style="color:${BRAND.lavenderDeep};">${r.remindClock}</strong>
                  · starts ${r.startClock}
                </p>
              </td></tr></table>
            </td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:12px;font-size:14px;color:${BRAND.muted};">Add times in titles (e.g. Math 3:00 to 5:20) so reminders can fire.</td></tr>`;

  const html = wrap(`
    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.lavender};">
      Plan locked
    </p>
    <h1 style="margin:0 0 10px;font-size:26px;color:${BRAND.ink};">Nudges armed for ${escapeHtml(opts.planDate)}</h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.5;color:${BRAND.muted};">
      I’ll ping you <strong>15 minutes before</strong> each timed task — cute, not nagging.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${scheduleHtml}</table>
    ${quoteBlockHtml(opts.quote)}
    <p style="margin:20px 0 0;font-size:15px;color:${BRAND.ink};">Sleep well. Tomorrow-you is already proud.</p>
  `);

  return { subject, text, html };
}

export function planConfirmedEmail(opts: {
  planDate: string;
  tasks: Array<{
    title: string;
    tags: string[];
    isFrog: boolean;
    firstFiveMinutes?: string | null;
  }>;
}) {
  const frog = opts.tasks.find((t) => t.isFrog);
  const lines = opts.tasks
    .map(
      (t, i) =>
        `${i + 1}. ${t.isFrog ? "🐸 " : ""}${t.title}${
          t.tags.length ? ` [${t.tags.join(", ")}]` : ""
        }`,
    )
    .join("\n");

  const subject = `Arin locked tomorrow · ${opts.planDate} (${opts.tasks.length} tasks)`;
  const text = `Hey Emon —

Arin just confirmed her study plan for ${opts.planDate}.

Frog: ${frog?.title ?? "(none marked)"}

Checklist:
${lines}

Open the diary when you want to cheer her on.

— Arin's Study Diary`;

  const listHtml = opts.tasks
    .map(
      (t) =>
        `<tr><td style="padding:0 0 10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${
            t.isFrog ? BRAND.blush : BRAND.cream
          };border-radius:14px;border:1px solid ${BRAND.border};">
            <tr><td style="padding:12px 14px;font-family:Georgia,'Times New Roman',serif;color:${BRAND.ink};">
              ${
                t.isFrog
                  ? `<span style="display:inline-block;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.lavender};">Frog of the day</span><br/>`
                  : ""
              }
              <span style="font-size:15px;font-weight:700;">${escapeHtml(t.title)}</span>
              ${
                t.tags.length
                  ? `<div style="margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.soft};">${escapeHtml(
                      t.tags.join(" · "),
                    )}</div>`
                  : ""
              }
            </td></tr>
          </table>
        </td></tr>`,
    )
    .join("");

  const html = wrap(`
    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.lavender};">
      Plan update
    </p>
    <h1 style="margin:0 0 8px;font-size:26px;color:${BRAND.ink};">Arin confirmed ${escapeHtml(
      opts.planDate,
    )}</h1>
    <p style="margin:0 0 18px;font-size:15px;color:${BRAND.muted};">
      ${opts.tasks.length} tasks locked · Frog is ready.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${listHtml}</table>
  `);

  return { subject, text, html };
}

export function withdrawRequestEmail(opts: {
  amountTk: number;
  pointsSpent: number;
  note?: string | null;
  paymentMethod?: string | null;
  paymentNumber?: string | null;
  balanceAfter: number;
}) {
  const methodLabel = (opts.paymentMethod || "—").toUpperCase();
  const subject = `Withdraw · ${opts.amountTk} Tk from Arin`;
  const text = `Hey Emon —

Arin requested a cash withdraw from her study points.

Amount: ${opts.amountTk} Tk (${opts.pointsSpent} points)
Payment: ${opts.paymentMethod || "—"} ${opts.paymentNumber || ""}
Note / preference: ${opts.note || "(none)"}
Balance after: ${opts.balanceAfter} pts

Please fulfill when you can (bKash / Rocket).

— Arin's Study Diary`;

  const html = wrap(`
    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.lavender};">
      Cash withdraw
    </p>
    <h1 style="margin:0 0 8px;font-size:32px;color:${BRAND.ink};">${opts.amountTk} Tk</h1>
    <p style="margin:0 0 18px;font-size:15px;color:${BRAND.muted};">
      Arin spent ${opts.pointsSpent} study points. Send when you can.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:${BRAND.ink};">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.soft};">Method</td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:700;">${escapeHtml(methodLabel)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.soft};">Number</td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:700;">${escapeHtml(
          opts.paymentNumber || "—",
        )}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.soft};">Note</td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right;">${escapeHtml(
          opts.note || "—",
        )}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:${BRAND.soft};">Balance left</td>
        <td style="padding:12px 0;text-align:right;font-weight:700;">${opts.balanceAfter} pts</td>
      </tr>
    </table>
  `);

  return { subject, text, html };
}

/** Soft love-note email when Arin ↔ Emon sends encouragement. */
export function encouragementNoteEmail(opts: {
  fromName: string;
  toName: string;
  body: string;
  diaryUrl?: string;
}) {
  const short =
    opts.body.length > 48 ? `${opts.body.slice(0, 45).trim()}…` : opts.body;
  const subject = `A note from ${opts.fromName} · “${short}”`;
  const text = `Hey ${opts.toName},

${opts.fromName} left you a note in your Study Diary:

“${opts.body}”

Open Together → Notes to reply.
${opts.diaryUrl ? opts.diaryUrl : ""}

— Study Diary · Arin & Emon`;

  const url = opts.diaryUrl || "https://arins-study-diary.vercel.app/together?tab=notes";
  const html = wrap(
    `
    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.lavender};">
      For you
    </p>
    <h1 style="margin:0 0 10px;font-size:28px;line-height:1.25;color:${BRAND.lavenderDeep};">
      ${escapeHtml(opts.fromName)} wrote you a note
    </h1>
    <p style="margin:0 0 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:${BRAND.muted};">
      Hey ${escapeHtml(opts.toName)} — a little encouragement, just for you.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:22px 22px;background:${BRAND.blush};border-radius:20px;border:1px solid ${BRAND.border};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.45;font-style:italic;color:${BRAND.ink};">
            “${escapeHtml(opts.body)}”
          </p>
          <p style="margin:14px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:600;color:${BRAND.lavender};">
            — ${escapeHtml(opts.fromName)}
          </p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-radius:999px;background:${BRAND.lavenderDeep};">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
            Reply in Study Diary
          </a>
        </td>
      </tr>
    </table>
  `,
    "Study Diary · Arin & Emon · notes that keep you both going",
  );

  return { subject, text, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
