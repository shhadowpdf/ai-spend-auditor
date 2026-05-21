import { Resend } from "resend";
import { ENV } from "./ENV.js";
import {
  formatCurrency,
  getToolPotentialSavings,
  getTotalPotentialSavings,
} from "./publicAudit.js";

const DEFAULT_FROM_ADDRESS =
  "AI Audit <onboarding@resend.dev>";
const DEFAULT_HIGH_SAVINGS_THRESHOLD = 500;
const LEAD_INTEREST_TYPES = {
  HIGH_SAVINGS: "high_savings_follow_up",
  NOTIFY_ME: "notify_me",
};

const resend = ENV.RESEND_API_KEY
  ? new Resend(ENV.RESEND_API_KEY)
  : null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getHighSavingsThreshold() {
  const configuredThreshold = Number(
    ENV.AUDIT_HIGH_SAVINGS_MONTHLY_THRESHOLD
  );

  if (
    Number.isFinite(configuredThreshold) &&
    configuredThreshold >= 0
  ) {
    return configuredThreshold;
  }

  return DEFAULT_HIGH_SAVINGS_THRESHOLD;
}

function getTopSavingsOpportunities(
  report,
  limit = 3
) {
  return (report?.toolAudits || [])
    .map((toolAudit) => ({
      toolName: toolAudit?.toolName || "Tool",
      bestAlternative:
        toolAudit?.bestAlternative || null,
      savings: getToolPotentialSavings(toolAudit),
    }))
    .filter(
      (toolAudit) =>
        toolAudit.bestAlternative &&
        toolAudit.savings > 0
    )
    .sort((a, b) => b.savings - a.savings)
    .slice(0, limit);
}

function buildEmailSubject(totalPotentialSavings) {
  if (totalPotentialSavings > 0) {
    return `Your Credex audit is ready: ${formatCurrency(totalPotentialSavings)}/mo in potential savings`;
  }

  return "Your Credex audit is ready";
}

function buildOpportunityMarkup(
  topOpportunities
) {
  if (topOpportunities.length === 0) {
    return "";
  }

  return `
    <div style="margin-top: 24px;">
      <h2 style="margin: 0 0 12px; font-size: 18px; color: #111827;">Top savings opportunities</h2>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${topOpportunities
          .map(
            (opportunity) => `
              <li style="margin-bottom: 10px;">
                <strong>${escapeHtml(
                  opportunity.toolName
                )}</strong>: save
                <strong>${formatCurrency(
                  opportunity.savings
                )}/mo</strong>
                by switching to
                ${escapeHtml(
                  opportunity.bestAlternative.toolName
                )} ${escapeHtml(
                  opportunity.bestAlternative.planName
                )}.
              </li>
            `
          )
          .join("")}
      </ul>
    </div>
  `;
}

function buildHtmlEmail({
  companyName,
  totalMonthlySpend,
  totalPotentialSavings,
  publicUrl,
  topOpportunities,
  highSavingsCase,
}) {
  const companyLine = companyName
    ? ` for <strong>${escapeHtml(
        companyName
      )}</strong>`
    : "";
  const outcomeCopy =
    totalPotentialSavings > 0
      ? `We found up to <strong>${formatCurrency(
          totalPotentialSavings
        )}/mo</strong> in potential savings from lower-cost options that still fit your selected use cases.`
      : "We did not find a cheaper matched alternative for the tools and use cases you submitted.";
  const savingsFollowUpCopy = highSavingsCase
    ? `This looks like a high-savings case, and the Credex team will reach out with next steps.`
    : "Credex reaches out directly on high-savings cases.";
  const shareLinkMarkup = publicUrl
    ? `
      <div style="margin-top: 28px;">
        <a href="${escapeHtml(
          publicUrl
        )}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
          View your redacted audit link
        </a>
      </div>
    `
    : "";

  return `
    <div style="margin: 0; padding: 32px 16px; background: #f3f4f6; font-family: Arial, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; color: #111827;">
        <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">
          Credex Audit Confirmation
        </p>
        <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2;">
          Your audit is complete
        </h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          Thanks for running an AI stack audit${companyLine}. We reviewed
          <strong>${formatCurrency(
            totalMonthlySpend
          )}/mo</strong> in current spend.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #374151;">
          ${outcomeCopy}
        </p>
        <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #374151;">
          ${savingsFollowUpCopy}
        </p>
        ${buildOpportunityMarkup(
          topOpportunities
        )}
        ${shareLinkMarkup}
      </div>
    </div>
  `;
}

function buildTextEmail({
  companyName,
  totalMonthlySpend,
  totalPotentialSavings,
  publicUrl,
  topOpportunities,
  highSavingsCase,
}) {
  const lines = [
    "Your Credex audit is complete.",
    "",
    `Current spend reviewed: ${formatCurrency(
      totalMonthlySpend
    )}/mo${companyName ? ` for ${companyName}` : ""}.`,
  ];

  if (totalPotentialSavings > 0) {
    lines.push(
      `Potential savings identified: ${formatCurrency(
        totalPotentialSavings
      )}/mo.`
    );
  } else {
    lines.push(
      "No cheaper matched alternative was found for the submitted tools and use cases."
    );
  }

  if (topOpportunities.length > 0) {
    lines.push("", "Top savings opportunities:");

    topOpportunities.forEach((opportunity) => {
      lines.push(
        `- ${opportunity.toolName}: save ${formatCurrency(
          opportunity.savings
        )}/mo by switching to ${opportunity.bestAlternative.toolName} ${opportunity.bestAlternative.planName}.`
      );
    });
  }

  lines.push(
    "",
    highSavingsCase
      ? "This looks like a high-savings case, and the Credex team will reach out with next steps."
      : "Credex reaches out directly on high-savings cases."
  );

  if (publicUrl) {
    lines.push("", `Redacted audit link: ${publicUrl}`);
  }

  return lines.join("\n");
}

function buildLeadCaptureCopy({
  companyName,
  publicUrl,
  interestType,
}) {
  const companyLine = companyName
    ? ` for ${companyName}`
    : "";

  if (
    interestType ===
    LEAD_INTEREST_TYPES.HIGH_SAVINGS
  ) {
    return {
      subject:
        "Credex will follow up on your audit",
      html: `
        <div style="margin: 0; padding: 32px 16px; background: #f3f4f6; font-family: Arial, sans-serif;">
          <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; color: #111827;">
            <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">
              Credex Follow-Up Confirmed
            </p>
            <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2;">
              We have your audit
            </h1>
            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #374151;">
              Thanks. Credex will reach out${companyLine} to help you capture the savings identified in your audit.
            </p>
            ${
              publicUrl
                ? `
                  <div style="margin-top: 28px;">
                    <a href="${escapeHtml(
                      publicUrl
                    )}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
                      View your redacted audit link
                    </a>
                  </div>
                `
                : ""
            }
          </div>
        </div>
      `,
      text: [
        "Credex will follow up on your audit.",
        "",
        `Thanks. Credex will reach out${companyLine} to help you capture the savings identified in your audit.`,
        publicUrl
          ? `Redacted audit link: ${publicUrl}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return {
    subject:
      "You're on the Credex optimization watchlist",
    html: `
      <div style="margin: 0; padding: 32px 16px; background: #f3f4f6; font-family: Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; color: #111827;">
          <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">
            Credex Optimization Watch
          </p>
          <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2;">
            We will keep an eye on your stack
          </h1>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #374151;">
            Thanks. We will notify you${companyLine} when new optimizations apply to your stack.
          </p>
          ${
            publicUrl
              ? `
                <div style="margin-top: 28px;">
                  <a href="${escapeHtml(
                    publicUrl
                  )}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
                    Revisit your audit
                  </a>
                </div>
              `
              : ""
          }
        </div>
      </div>
    `,
    text: [
      "You're on the Credex optimization watchlist.",
      "",
      `Thanks. We will notify you${companyLine} when new optimizations apply to your stack.`,
      publicUrl ? `Audit link: ${publicUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function buildResendPayload({
  email,
  subject,
  html,
  text,
  tags,
}) {
  const payload = {
    from:
      ENV.AUDIT_EMAIL_FROM ||
      DEFAULT_FROM_ADDRESS,
    to: email,
    subject,
    html,
    text,
    tags,
  };

  if (ENV.AUDIT_EMAIL_REPLY_TO) {
    payload.replyTo =
      ENV.AUDIT_EMAIL_REPLY_TO;
  }

  return payload;
}

async function sendResendEmail(payload) {
  if (!resend) {
    return {
      skipped: true,
      reason: "missing-resend-config",
    };
  }

  const { data, error } =
    await resend.emails.send(payload);

  if (error) {
    throw new Error(
      error.message ||
        "Unable to send email."
    );
  }

  return {
    skipped: false,
    emailId: data?.id || null,
  };
}

export async function sendAuditConfirmationEmail({
  email,
  companyName,
  report,
  publicUrl,
}) {
  const recipientEmail = String(email || "").trim();

  if (!recipientEmail) {
    return {
      skipped: true,
      reason: "missing-recipient",
    };
  }

  const totalMonthlySpend =
    report?.summary?.totalMonthlySpend || 0;
  const totalPotentialSavings =
    getTotalPotentialSavings(report);
  const topOpportunities =
    getTopSavingsOpportunities(report);
  const highSavingsThreshold =
    getHighSavingsThreshold();
  const highSavingsCase =
    totalPotentialSavings >=
    highSavingsThreshold;

  const emailResult =
    await sendResendEmail(
      buildResendPayload({
        email: recipientEmail,
        subject: buildEmailSubject(
          totalPotentialSavings
        ),
        html: buildHtmlEmail({
          companyName,
          totalMonthlySpend,
          totalPotentialSavings,
          publicUrl,
          topOpportunities,
          highSavingsCase,
        }),
        text: buildTextEmail({
          companyName,
          totalMonthlySpend,
          totalPotentialSavings,
          publicUrl,
          topOpportunities,
          highSavingsCase,
        }),
        tags: [
          {
            name: "email_type",
            value: "audit_confirmation",
          },
          {
            name: "savings_case",
            value: highSavingsCase
              ? "high"
              : "standard",
          },
        ],
      })
    );

  if (emailResult.skipped) {
    return emailResult;
  }

  return {
    ...emailResult,
    provider: "resend",
    highSavingsCase,
    totalPotentialSavings,
  };
}

export async function sendLeadCaptureConfirmationEmail(
  {
    email,
    companyName,
    publicUrl,
    interestType,
  }
) {
  const recipientEmail = String(email || "").trim();

  if (!recipientEmail) {
    return {
      skipped: true,
      reason: "missing-recipient",
    };
  }

  const copy = buildLeadCaptureCopy({
    companyName,
    publicUrl,
    interestType,
  });
  const emailResult =
    await sendResendEmail(
      buildResendPayload({
        email: recipientEmail,
        subject: copy.subject,
        html: copy.html,
        text: copy.text,
        tags: [
          {
            name: "email_type",
            value: "lead_capture_confirmation",
          },
          {
            name: "interest_type",
            value:
              interestType ===
              LEAD_INTEREST_TYPES.HIGH_SAVINGS
                ? "high_savings"
                : "notify_me",
          },
        ],
      })
    );

  if (emailResult.skipped) {
    return emailResult;
  }

  return {
    ...emailResult,
    provider: "resend",
    interestType,
  };
}

export { LEAD_INTEREST_TYPES };

export async function sendPricingChangeNotificationEmail({
  email,
  companyName,
  affectedAudits = [],
}) {
  const recipientEmail = String(email || "").trim();

  if (!recipientEmail) {
    return { skipped: true, reason: "missing-recipient" };
  }

  const totalDelta = affectedAudits.reduce((sum, a) => sum + (a.changeSummary?.savingsDelta || 0), 0);

  const subject =
    affectedAudits.length > 0
      ? `Credex: ${affectedAudits.length} audit${affectedAudits.length === 1 ? "" : "s"} updated — pricing changes detected`
      : "Credex: audit updates";

  const publicUrlFor = (auditId) =>
    (ENV.PUBLIC_URL || "") + `/public/audits/${auditId}`;

  const htmlList = affectedAudits
    .map((a) => {
      const link = a.auditId ? escapeHtml(publicUrlFor(a.auditId)) : "";
      const delta = formatCurrency(a.changeSummary?.savingsDelta || 0);
      return `
        <li style="margin-bottom:10px;">
          <strong>${escapeHtml(a.auditId)}</strong> — ${escapeHtml(a.changeSummary?.pricingDiff?.hasChanges ? `${a.changeSummary.pricingDiff.changes.length} pricing changes` : "Report changed")} · Savings delta: <strong>${escapeHtml(delta)}</strong>
          ${link ? `<div><a href="${link}" style="color:#2563eb">View audit</a></div>` : ""}
        </li>
      `;
    })
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;padding:24px;">
      <h2 style="margin-top:0;">Pricing changes detected for your Credex audit${companyName ? ` — ${escapeHtml(companyName)}` : ""}</h2>
      <p>We re-ran your saved audits and found changes that may affect your recommendations. Total savings delta across affected audits: <strong>${formatCurrency(totalDelta)}</strong>/mo.</p>
      <ul style="padding-left:16px;">${htmlList}</ul>
      <p style="margin-top:18px;">If you want us to re-run or review any of these, visit your audit links above.</p>
    </div>
  `;

  const text = [
    `Pricing changes detected for ${affectedAudits.length} audit(s).`,
    `Total savings delta: ${formatCurrency(totalDelta)}/mo.`,
    ...affectedAudits.map((a) => `- ${a.auditId}: delta ${formatCurrency(a.changeSummary?.savingsDelta || 0)}`),
  ].join("\n");

  const emailResult = await sendResendEmail(
    buildResendPayload({
      email: recipientEmail,
      subject,
      html,
      text,
      tags: [
        { name: "email_type", value: "pricing_change_notification" },
      ],
    })
  );

  if (emailResult.skipped) return emailResult;

  return { ...emailResult, provider: "resend", totalDelta, count: affectedAudits.length };
}
