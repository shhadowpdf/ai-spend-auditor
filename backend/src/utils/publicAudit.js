const compactCurrencyFormatter =
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const preciseCurrencyFormatter =
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateFormatter = new Intl.DateTimeFormat(
  "en-US",
  {
    month: "long",
    day: "numeric",
    year: "numeric",
  }
);

export function formatCurrency(value = 0) {
  return preciseCurrencyFormatter.format(
    Number(value || 0)
  );
}

function formatCompactCurrency(value = 0) {
  return compactCurrencyFormatter.format(
    Number(value || 0)
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function truncateText(value = "", maxLength = 120) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function getAlternativeMonthlyCost(alternative) {
  if (!alternative) {
    return 0;
  }

  return (
    alternative.monthlyCost ||
    alternative.estimatedMonthlyCost ||
    0
  );
}

export function getToolPotentialSavings(toolAudit) {
  return Math.max(
    (toolAudit?.currentMonthlySpend || 0) -
      getAlternativeMonthlyCost(
        toolAudit?.bestAlternative
      ),
    0
  );
}

export function getTotalPotentialSavings(report) {
  return (report?.toolAudits || []).reduce(
    (total, toolAudit) =>
      total + getToolPotentialSavings(toolAudit),
    0
  );
}

function getTopTools(report, limit = 3) {
  return (report?.toolAudits || [])
    .filter(
      (toolAudit) =>
        !toolAudit.error && toolAudit.toolName
    )
    .map((toolAudit) => toolAudit.toolName)
    .slice(0, limit);
}

function buildShareTitle(report, totalPotentialSavings) {
  const toolCount =
    report?.summary?.numberOfTools || 0;

  if (totalPotentialSavings > 0) {
    return `This AI stack could save ${formatCompactCurrency(totalPotentialSavings)}/mo`;
  }

  return `AI stack audit across ${toolCount} tool${toolCount === 1 ? "" : "s"}`;
}

function buildShareDescription(
  report,
  totalPotentialSavings
) {
  const toolCount =
    report?.summary?.numberOfTools || 0;
  const totalMonthlySpend =
    report?.summary?.totalMonthlySpend || 0;
  const topTools = getTopTools(report);
  const toolsLabel =
    topTools.length > 0
      ? `Featuring ${topTools.join(", ")}. `
      : "";

  if (totalPotentialSavings > 0) {
    return `${toolsLabel}Public audit across ${toolCount} AI tools with ${formatCompactCurrency(totalMonthlySpend)}/mo current spend and ${formatCompactCurrency(totalPotentialSavings)}/mo in potential savings.`;
  }

  return `${toolsLabel}Public audit across ${toolCount} AI tools with ${formatCompactCurrency(totalMonthlySpend)}/mo current spend and no cheaper matched alternative found.`;
}

export function buildPublicAuditPayload({
  publicId,
  publicUrl,
  createdAt,
  report,
  llmResponse,
}) {
  const totalPotentialSavings =
    getTotalPotentialSavings(report);
  const annualPotentialSavings =
    totalPotentialSavings * 12;
  const shareTitle = buildShareTitle(
    report,
    totalPotentialSavings
  );
  const shareDescription = buildShareDescription(
    report,
    totalPotentialSavings
  );

  return {
    publicId,
    publicUrl,
    createdAt,
    summary: report.summary,
    overallRecommendations:
      report.overallRecommendations,
    toolAudits: report.toolAudits,
    llmResponse: llmResponse || "",
    shareCard: {
      title: shareTitle,
      description: shareDescription,
      topTools: getTopTools(report),
      totalPotentialSavings,
      annualPotentialSavings,
    },
  };
}

function renderUseCases(useCases = []) {
  if (useCases.length === 0) {
    return "";
  }

  return `<div class="chip-row">${useCases
    .map(
      (useCase) =>
        `<span class="chip">${escapeHtml(
          useCase
        )}</span>`
    )
    .join("")}</div>`;
}

function renderAlternative(toolAudit) {
  if (
    !toolAudit.hasCheaperAlternative ||
    !toolAudit.bestAlternative
  ) {
    return `<div class="tool-note neutral">No cheaper matched alternative found for this tool.</div>`;
  }

  const alternativeCost = getAlternativeMonthlyCost(
    toolAudit.bestAlternative
  );
  const savings = getToolPotentialSavings(toolAudit);

  return `
    <div class="tool-note positive">
      <div>
        <p class="label">Best alternative</p>
        <h4>${escapeHtml(
          toolAudit.bestAlternative.toolName
        )} · ${escapeHtml(
          toolAudit.bestAlternative.planName
        )}</h4>
        <p class="meta">${escapeHtml(
          toolAudit.bestAlternative.priceLabel
        )}</p>
      </div>
      <div class="savings-block">
        <span>New cost</span>
        <strong>${formatCurrency(
          alternativeCost
        )}/mo</strong>
        <em>Save ${formatCurrency(
          savings
        )}/mo</em>
      </div>
    </div>
  `;
}

function renderToolCards(toolAudits = []) {
  return toolAudits
    .map((toolAudit) => {
      if (toolAudit.error) {
        return `
          <article class="tool-card tool-card--error">
            <p class="label">Unavailable</p>
            <h3>${escapeHtml(
              toolAudit.toolName || "Unknown tool"
            )}</h3>
            <p class="error-copy">${escapeHtml(
              toolAudit.error
            )}</p>
          </article>
        `;
      }

      return `
        <article class="tool-card">
          <div class="tool-header">
            <div>
              <p class="label">Current stack</p>
              <h3>${escapeHtml(
                toolAudit.toolName
              )}</h3>
              <p class="meta">Plan: ${escapeHtml(
                toolAudit.currentPlan
              )}</p>
            </div>
            <div class="tool-spend">
              <span>Current spend</span>
              <strong>${formatCurrency(
                toolAudit.currentMonthlySpend
              )}/mo</strong>
            </div>
          </div>
          ${renderUseCases(toolAudit.useCases)}
          ${renderAlternative(toolAudit)}
        </article>
      `;
    })
    .join("");
}

export function renderPublicAuditPage(
  publicAudit,
  {
    canonicalUrl,
    ogImageUrl,
    appUrl,
  }
) {
  const report = publicAudit.publicReport;
  const shareCard = report.shareCard;
  const createdAtLabel = dateFormatter.format(
    new Date(report.createdAt)
  );
  const recommendation =
    report.overallRecommendations?.[0] || "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(
      shareCard.title
    )}</title>
    <meta name="description" content="${escapeHtml(
      shareCard.description
    )}" />
    <link rel="canonical" href="${escapeHtml(
      canonicalUrl
    )}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Audit" />
    <meta property="og:url" content="${escapeHtml(
      canonicalUrl
    )}" />
    <meta property="og:title" content="${escapeHtml(
      shareCard.title
    )}" />
    <meta property="og:description" content="${escapeHtml(
      shareCard.description
    )}" />
    <meta property="og:image" content="${escapeHtml(
      ogImageUrl
    )}" />
    <meta property="og:image:alt" content="${escapeHtml(
      shareCard.title
    )}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(
      shareCard.title
    )}" />
    <meta name="twitter:description" content="${escapeHtml(
      shareCard.description
    )}" />
    <meta name="twitter:image" content="${escapeHtml(
      ogImageUrl
    )}" />
    <meta name="twitter:image:alt" content="${escapeHtml(
      shareCard.title
    )}" />
    <meta name="theme-color" content="#09090b" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #05070d;
        --panel: rgba(11, 15, 23, 0.88);
        --panel-strong: #0f1726;
        --border: rgba(148, 163, 184, 0.16);
        --text: #f8fafc;
        --muted: #94a3b8;
        --accent: #8b5cf6;
        --accent-soft: rgba(139, 92, 246, 0.14);
        --success: #34d399;
        --success-soft: rgba(52, 211, 153, 0.14);
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(99, 102, 241, 0.24), transparent 36%),
          radial-gradient(circle at top right, rgba(16, 185, 129, 0.18), transparent 28%),
          linear-gradient(180deg, #030507 0%, #070b12 100%);
      }
      a {
        color: inherit;
        text-decoration: none;
      }
      .shell {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 40px 0 72px;
      }
      .hero {
        position: relative;
        overflow: hidden;
        padding: 40px;
        border-radius: 32px;
        background:
          linear-gradient(135deg, rgba(15, 23, 38, 0.96), rgba(17, 24, 39, 0.88)),
          var(--panel);
        border: 1px solid var(--border);
        box-shadow: 0 24px 80px rgba(2, 6, 23, 0.45);
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: -120px -80px auto auto;
        width: 260px;
        height: 260px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(139, 92, 246, 0.35), transparent 70%);
        pointer-events: none;
      }
      .eyebrow,
      .label {
        margin: 0 0 10px;
        color: #c4b5fd;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
      }
      .hero h1 {
        margin: 0;
        max-width: 760px;
        font-size: clamp(2.6rem, 5vw, 4.8rem);
        line-height: 0.98;
      }
      .hero p {
        max-width: 700px;
        margin: 18px 0 0;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.7;
      }
      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
      }
      .hero-pill {
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.68);
        border: 1px solid rgba(196, 181, 253, 0.18);
        color: #d4d4d8;
        font-size: 0.92rem;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-top: 24px;
      }
      .metric {
        padding: 22px;
        border-radius: 24px;
        background: var(--panel);
        border: 1px solid var(--border);
        backdrop-filter: blur(12px);
      }
      .metric span {
        display: block;
        color: var(--muted);
        font-size: 0.92rem;
      }
      .metric strong {
        display: block;
        margin-top: 10px;
        font-size: clamp(1.6rem, 2.5vw, 2.3rem);
        line-height: 1.1;
      }
      .metric--positive strong {
        color: var(--success);
      }
      .section {
        margin-top: 24px;
        padding: 28px;
        border-radius: 28px;
        background: var(--panel);
        border: 1px solid var(--border);
      }
      .section h2 {
        margin: 0;
        font-size: 1.5rem;
      }
      .section-copy {
        margin: 12px 0 0;
        color: var(--muted);
        line-height: 1.7;
      }
      .privacy-banner {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-top: 18px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.76);
        border: 1px solid rgba(148, 163, 184, 0.18);
        color: #cbd5e1;
        font-size: 0.92rem;
      }
      .tool-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        margin-top: 24px;
      }
      .tool-card {
        padding: 24px;
        border-radius: 24px;
        background: rgba(2, 6, 23, 0.65);
        border: 1px solid rgba(148, 163, 184, 0.12);
      }
      .tool-card h3 {
        margin: 0;
        font-size: 1.35rem;
      }
      .tool-card--error {
        border-color: rgba(248, 113, 113, 0.24);
      }
      .tool-header,
      .tool-note {
        display: flex;
        justify-content: space-between;
        gap: 18px;
      }
      .tool-spend,
      .savings-block {
        min-width: 150px;
        text-align: right;
      }
      .tool-spend span,
      .savings-block span,
      .meta,
      .tool-note em {
        color: var(--muted);
        font-size: 0.92rem;
      }
      .tool-spend strong,
      .savings-block strong {
        display: block;
        margin-top: 8px;
        font-size: 1.15rem;
      }
      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 18px 0;
      }
      .chip {
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(30, 41, 59, 0.7);
        color: #cbd5e1;
        font-size: 0.84rem;
        text-transform: capitalize;
      }
      .tool-note {
        margin-top: 18px;
        padding: 18px;
        border-radius: 20px;
        align-items: center;
      }
      .tool-note h4 {
        margin: 0;
        font-size: 1.05rem;
      }
      .tool-note.positive {
        background: var(--success-soft);
        border: 1px solid rgba(52, 211, 153, 0.18);
      }
      .tool-note.positive em {
        display: block;
        margin-top: 6px;
        color: #bbf7d0;
        font-style: normal;
      }
      .tool-note.neutral {
        background: rgba(15, 23, 42, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.12);
        color: #cbd5e1;
      }
      .error-copy {
        margin-top: 10px;
        color: #fca5a5;
      }
      .cta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        margin-top: 24px;
        padding: 28px;
        border-radius: 28px;
        background:
          linear-gradient(135deg, rgba(91, 33, 182, 0.24), rgba(16, 185, 129, 0.14)),
          rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(139, 92, 246, 0.18);
      }
      .cta h2 {
        margin: 0;
        font-size: 1.7rem;
      }
      .cta p {
        margin: 10px 0 0;
        color: #d4d4d8;
        line-height: 1.7;
      }
      .cta-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 52px;
        padding: 0 18px;
        border-radius: 18px;
        border: 1px solid transparent;
        font-weight: 600;
      }
      .button--primary {
        background: #8b5cf6;
      }
      .button--secondary {
        background: rgba(15, 23, 42, 0.78);
        border-color: rgba(196, 181, 253, 0.16);
      }
      @media (max-width: 980px) {
        .metrics,
        .tool-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 760px) {
        .shell {
          width: min(100% - 20px, 1120px);
          padding: 20px 0 40px;
        }
        .hero,
        .section,
        .cta {
          padding: 22px;
          border-radius: 24px;
        }
        .metrics,
        .tool-grid {
          grid-template-columns: 1fr;
        }
        .tool-header,
        .tool-note,
        .cta {
          flex-direction: column;
          align-items: flex-start;
        }
        .tool-spend,
        .savings-block {
          min-width: 0;
          text-align: left;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">Public AI Spend Audit</p>
        <h1>${escapeHtml(
          shareCard.title
        )}</h1>
        <p>${escapeHtml(
          shareCard.description
        )}</p>
        <div class="hero-meta">
          <span class="hero-pill">Created ${escapeHtml(
            createdAtLabel
          )}</span>
          <span class="hero-pill">Public view only</span>
        </div>
        <div class="privacy-banner">
          Company name and email are removed from every shared audit.
        </div>
      </section>

      <section class="metrics">
        <div class="metric">
          <span>Current monthly spend</span>
          <strong>${formatCurrency(
            report.summary.totalMonthlySpend
          )}</strong>
        </div>
        <div class="metric">
          <span>Tools analyzed</span>
          <strong>${escapeHtml(
            String(report.summary.numberOfTools)
          )}</strong>
        </div>
        <div class="metric metric--positive">
          <span>Potential monthly savings</span>
          <strong>${formatCurrency(
            shareCard.totalPotentialSavings
          )}</strong>
        </div>
        <div class="metric metric--positive">
          <span>Potential annual savings</span>
          <strong>${formatCurrency(
            shareCard.annualPotentialSavings
          )}</strong>
        </div>
      </section>

      <section class="section">
        <p class="label">Snapshot</p>
        <h2>What this stack reveals</h2>
        <p class="section-copy">${escapeHtml(
          recommendation ||
            "This public snapshot shows current spend, matched alternatives, and where savings may exist."
        )}</p>
        ${
          report.llmResponse
            ? `<p class="section-copy">${escapeHtml(
                report.llmResponse
              )}</p>`
            : ""
        }
      </section>

      <section class="section">
        <p class="label">Tool-by-tool</p>
        <h2>Where the savings are hiding</h2>
        <p class="section-copy">Every tool below keeps the savings numbers visible while identity stays private.</p>
        <div class="tool-grid">
          ${renderToolCards(report.toolAudits)}
        </div>
      </section>

      <section class="cta">
        <div>
          <p class="label">Viral Loop</p>
          <h2>Run your own AI stack audit</h2>
          <p>Drop in the tools you already pay for and get a shareable public snapshot in minutes.</p>
        </div>
        <div class="cta-actions">
          <a class="button button--primary" href="${escapeHtml(
            `${appUrl}/audit`
          )}">Start an audit</a>
          <a class="button button--secondary" href="${escapeHtml(
            appUrl
          )}">Visit homepage</a>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export function renderPublicAuditNotFoundPage(
  appUrl
) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Audit link not found</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        color: #f8fafc;
        background: linear-gradient(180deg, #020617 0%, #09090b 100%);
        font-family: "Segoe UI", sans-serif;
      }
      .card {
        width: min(540px, 100%);
        padding: 32px;
        border-radius: 24px;
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.14);
      }
      h1 {
        margin: 0 0 12px;
      }
      p {
        margin: 0;
        color: #94a3b8;
        line-height: 1.7;
      }
      a {
        display: inline-flex;
        margin-top: 22px;
        padding: 12px 18px;
        border-radius: 16px;
        background: #8b5cf6;
        color: white;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <section class="card">
      <h1>That audit link is no longer available.</h1>
      <p>The shared report may have expired, been removed, or never existed. You can still run a fresh audit from the main app.</p>
      <a href="${escapeHtml(
        `${appUrl}/audit`
      )}">Start a new audit</a>
    </section>
  </body>
</html>`;
}

export function renderPublicAuditOgImage(
  publicAudit
) {
  const report = publicAudit.publicReport;
  const shareCard = report.shareCard;
  const title = truncateText(
    shareCard.title,
    42
  );
  const description = truncateText(
    shareCard.description,
    110
  );
  const topTools = truncateText(
    (shareCard.topTools || []).join(" · ") ||
      "AI tool audit",
    40
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="90" y1="40" x2="1110" y2="590" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F172A" />
      <stop offset="1" stop-color="#020617" />
    </linearGradient>
    <radialGradient id="glowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1030 120) rotate(131.653) scale(280 210)">
      <stop stop-color="#8B5CF6" stop-opacity="0.6" />
      <stop offset="1" stop-color="#8B5CF6" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(220 40) rotate(76.5043) scale(320 260)">
      <stop stop-color="#10B981" stop-opacity="0.36" />
      <stop offset="1" stop-color="#10B981" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="#020617" />
  <rect x="40" y="40" width="1120" height="550" rx="36" fill="url(#bg)" stroke="rgba(148,163,184,0.18)" />
  <rect x="40" y="40" width="1120" height="550" rx="36" fill="url(#glowA)" />
  <rect x="40" y="40" width="1120" height="550" rx="36" fill="url(#glowB)" />

  <text x="88" y="108" fill="#C4B5FD" font-family="Segoe UI, sans-serif" font-size="22" letter-spacing="5.2">PUBLIC AI SPEND AUDIT</text>
  <text x="88" y="194" fill="#F8FAFC" font-family="Segoe UI, sans-serif" font-size="58" font-weight="700">${escapeHtml(
    title
  )}</text>
  <text x="88" y="252" fill="#94A3B8" font-family="Segoe UI, sans-serif" font-size="26">${escapeHtml(
    description
  )}</text>

  <rect x="88" y="328" width="310" height="166" rx="28" fill="rgba(15,23,42,0.82)" stroke="rgba(148,163,184,0.14)" />
  <rect x="418" y="328" width="310" height="166" rx="28" fill="rgba(15,23,42,0.82)" stroke="rgba(148,163,184,0.14)" />
  <rect x="748" y="328" width="364" height="166" rx="28" fill="rgba(15,23,42,0.82)" stroke="rgba(148,163,184,0.14)" />

  <text x="124" y="376" fill="#94A3B8" font-family="Segoe UI, sans-serif" font-size="22">Current monthly spend</text>
  <text x="124" y="436" fill="#F8FAFC" font-family="Segoe UI, sans-serif" font-size="42" font-weight="700">${escapeHtml(
    formatCurrency(
      report.summary.totalMonthlySpend
    )
  )}</text>

  <text x="454" y="376" fill="#94A3B8" font-family="Segoe UI, sans-serif" font-size="22">Potential monthly savings</text>
  <text x="454" y="436" fill="#34D399" font-family="Segoe UI, sans-serif" font-size="42" font-weight="700">${escapeHtml(
    formatCurrency(
      shareCard.totalPotentialSavings
    )
  )}</text>

  <text x="784" y="376" fill="#94A3B8" font-family="Segoe UI, sans-serif" font-size="22">Tools analyzed</text>
  <text x="784" y="436" fill="#F8FAFC" font-family="Segoe UI, sans-serif" font-size="42" font-weight="700">${escapeHtml(
    String(report.summary.numberOfTools)
  )}</text>
  <text x="784" y="472" fill="#CBD5E1" font-family="Segoe UI, sans-serif" font-size="22">${escapeHtml(
    topTools
  )}</text>

  <rect x="88" y="526" width="1024" height="26" rx="13" fill="rgba(15,23,42,0.66)" />
  <text x="124" y="545" fill="#E2E8F0" font-family="Segoe UI, sans-serif" font-size="22">Company name and email are removed from every shared audit.</text>
</svg>`;
}
