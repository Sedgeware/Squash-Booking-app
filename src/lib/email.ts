import { Resend } from "resend";

// Lazy initialisation — avoids throwing at module load time during build
// when RESEND_API_KEY is not present in the build environment.
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM ?? "Tamworth Squash Ladder <noreply@example.com>";
const APP_URL = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
const LOGO_URL = `${APP_URL}/uploads/avatars/Tamworth-Squash-logo.png`;

// ─── Base HTML template ────────────────────────────────────────────────────────

function baseTemplate({
  preheader,
  body,
  ctaUrl,
  ctaLabel,
}: {
  preheader: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">

  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding:32px 40px 24px;border-bottom:1px solid #e5e7eb;">
              <img src="${LOGO_URL}" alt="Tamworth Squash" width="80"
                style="width:80px;height:auto;display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding:32px 40px 24px;">
              ${body}
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <a href="${ctaUrl}"
                style="display:inline-block;background-color:#16a34a;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:8px;">
                ${ctaLabel}
              </a>
              <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
                Or copy this link:&nbsp;<a href="${ctaUrl}" style="color:#6b7280;word-break:break-all;">${ctaUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Tamworth Squash Ladder</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Internal send helper ──────────────────────────────────────────────────────

async function send({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] Resend returned error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send to", to, "–", err);
  }
}

// ─── Public email functions ────────────────────────────────────────────────────

/** Sent to the player who received a challenge. */
export async function sendChallengeReceivedEmail({
  to,
  challengedName,
  challengerName,
  challengerRank,
}: {
  to: string;
  challengedName: string;
  challengerName: string;
  challengerRank: number | null;
}): Promise<void> {
  const rankText = challengerRank ? ` (currently ranked #${challengerRank})` : "";
  const ctaUrl = `${APP_URL}/ladder/my-challenges`;

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">You've been challenged!</h2>
    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hi ${challengedName},</p>
    <p style="margin:0 0 0;font-size:15px;color:#374151;">
      <strong>${challengerName}</strong>${rankText} has challenged you on the
      Tamworth Squash Ladder. Log in to accept or decline.
    </p>
  `;

  await send({
    to,
    subject: "You've been challenged on the Tamworth Squash Ladder",
    html: baseTemplate({
      preheader: `${challengerName} has challenged you`,
      body,
      ctaUrl,
      ctaLabel: "Log in to respond",
    }),
  });
}

/** Sent to the original challenger when their challenge is accepted. */
export async function sendChallengeAcceptedEmail({
  to,
  challengerName,
  challengedName,
  challengedRank,
}: {
  to: string;
  challengerName: string;
  challengedName: string;
  challengedRank: number | null;
}): Promise<void> {
  const rankText = challengedRank ? ` (ranked #${challengedRank})` : "";
  const ctaUrl = `${APP_URL}/ladder/my-challenges`;

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Challenge accepted!</h2>
    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hi ${challengerName},</p>
    <p style="margin:0 0 0;font-size:15px;color:#374151;">
      <strong>${challengedName}</strong>${rankText} has accepted your challenge.
      Time to arrange your match!
    </p>
  `;

  await send({
    to,
    subject: "Your challenge was accepted",
    html: baseTemplate({
      preheader: `${challengedName} accepted your challenge`,
      body,
      ctaUrl,
      ctaLabel: "View challenge",
    }),
  });
}

/** Sent to the original challenger when their challenge is declined. */
export async function sendChallengeDeclinedEmail({
  to,
  challengerName,
  challengedName,
}: {
  to: string;
  challengerName: string;
  challengedName: string;
}): Promise<void> {
  const ctaUrl = `${APP_URL}/ladder`;

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Challenge declined</h2>
    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hi ${challengerName},</p>
    <p style="margin:0 0 0;font-size:15px;color:#374151;">
      <strong>${challengedName}</strong> has declined your challenge.
      You're free to challenge another player.
    </p>
  `;

  await send({
    to,
    subject: "Your challenge was declined",
    html: baseTemplate({
      preheader: `${challengedName} declined your challenge`,
      body,
      ctaUrl,
      ctaLabel: "View ladder",
    }),
  });
}

/** Sent immediately after registration so the user can verify their email. */
export async function sendVerificationEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Verify your email address</h2>
    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hi ${name},</p>
    <p style="margin:0 0 0;font-size:15px;color:#374151;">
      Thanks for signing up for the Tamworth Squash Ladder. Click the button below
      to verify your email address and activate your account.
    </p>
  `;

  await send({
    to,
    subject: "Verify your email – Tamworth Squash Ladder",
    html: baseTemplate({
      preheader: "Verify your email to activate your account",
      body,
      ctaUrl: verifyUrl,
      ctaLabel: "Verify email address",
    }),
  });
}

/** Sent to a new user after they create an account. */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<void> {
  const ctaUrl = `${APP_URL}/ladder`;

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Welcome to the ladder, ${name}!</h2>
    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hi ${name},</p>
    <p style="margin:0 0 0;font-size:15px;color:#374151;">
      Your account is ready. Head to the ladder to request your spot and
      start challenging players.
    </p>
  `;

  await send({
    to,
    subject: "Welcome to the Tamworth Squash Ladder",
    html: baseTemplate({
      preheader: `Welcome, ${name}! Your account is ready.`,
      body,
      ctaUrl,
      ctaLabel: "View the ladder",
    }),
  });
}
