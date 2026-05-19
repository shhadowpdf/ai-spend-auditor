import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  LoaderIcon,
  ArrowLeft,
  TrendingDown,
  Zap,
  Link2,
  Copy,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import Container from "../components/layout/Container";
import { axiosInstance } from "../lib/axios";

interface Alternative {
  toolName: string;
  planName: string;
  monthlyCost?: number;
  estimatedMonthlyCost?: number;
  savings?: number;
  requiresSeat?: boolean;
  priceLabel: string;
}

interface ToolAudit {
  toolName: string;
  currentPlan: string;
  currentMonthlySpend: number;
  useCases: string[] | string;
  alternativeType: string;
  hasCheaperAlternative: boolean;
  bestAlternative: Alternative | null;
  alternatives: Alternative[];
  error?: string;
}

interface AuditReport {
  summary: {
    totalMonthlySpend: number;
    totalAnnualSpend: number;
    numberOfTools: number;
  };
  toolAudits: ToolAudit[];
  overallRecommendations: string[];
}

interface AuditMeta {
  companyName?: string | null;
  email?: string | null;
}

interface ShareMeta {
  publicId: string;
  publicUrl: string;
  createdAt: string;
  storage: "memory" | "supabase";
}

interface AuditResponse {
  data: AuditReport;
  LLMResponse?: string;
  meta?: AuditMeta;
  share?: ShareMeta | null;
}

interface LeadCaptureResponse {
  message: string;
  meta?: AuditMeta;
  share?: ShareMeta | null;
}

type LeadInterestType =
  | "high_savings_follow_up"
  | "notify_me";

type SavingsTier =
  | "high"
  | "efficient"
  | "moderate";

const HIGH_SAVINGS_THRESHOLD = 500;
const HONEST_SAVINGS_THRESHOLD = 100;
const AUDIT_RESULTS_KEY = "audit-results";

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

function formatCurrency(
  value = 0,
  mode: "compact" | "precise" = "precise",
) {
  const safeValue = Number(value || 0);

  return mode === "compact"
    ? compactCurrencyFormatter.format(safeValue)
    : preciseCurrencyFormatter.format(safeValue);
}

function getAlternativeCost(
  alternative?: Alternative | null,
) {
  return (
    alternative?.monthlyCost ??
    alternative?.estimatedMonthlyCost ??
    0
  );
}

function getToolSavings(toolAudit: ToolAudit) {
  return Math.max(
    toolAudit.currentMonthlySpend -
      getAlternativeCost(toolAudit.bestAlternative),
    0,
  );
}

function normalizeUseCases(
  useCases: ToolAudit["useCases"],
) {
  if (Array.isArray(useCases)) {
    return useCases.filter(Boolean);
  }

  if (typeof useCases === "string") {
    return useCases
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildRecommendedAction(
  toolAudit: ToolAudit,
  savings: number,
) {
  if (toolAudit.error) {
    return "Manual review needed";
  }

  if (
    !toolAudit.hasCheaperAlternative ||
    !toolAudit.bestAlternative ||
    savings < 1
  ) {
    return `Keep ${toolAudit.currentPlan}`;
  }

  if (
    toolAudit.bestAlternative.toolName ===
    toolAudit.toolName
  ) {
    return `Move to ${toolAudit.bestAlternative.planName}`;
  }

  return `Switch to ${toolAudit.bestAlternative.toolName} ${toolAudit.bestAlternative.planName}`;
}

function buildReason(
  toolAudit: ToolAudit,
  savings: number,
) {
  const useCases = normalizeUseCases(
    toolAudit.useCases,
  );
  const useCaseLabel =
    useCases.length > 0
      ? `for ${useCases.join(", ")}`
      : "for this tool";

  if (toolAudit.error) {
    return "We could not match this tool to pricing data, so this item needs a manual check.";
  }

  if (
    !toolAudit.hasCheaperAlternative ||
    !toolAudit.bestAlternative ||
    savings < 1
  ) {
    return `We did not find a cheaper matched option ${useCaseLabel}, so your current setup is already in a good spot.`;
  }

  if (
    toolAudit.bestAlternative.toolName ===
    toolAudit.toolName
  ) {
    return `This keeps you with the same vendor while lowering spend ${useCaseLabel}.`;
  }

  if (toolAudit.alternativeType === "api") {
    return `At your estimated usage, this alternative lands lower on token cost while still matching the selected use cases.`;
  }

  return `This was the lowest matched option we found ${useCaseLabel}, with meaningful savings and no extra scope added.`;
}

function getLeadStorageKey(publicId: string) {
  return `audit-lead:${publicId}`;
}

function persistLeadInterest(
  publicId: string,
  interestType: LeadInterestType,
) {
  window.sessionStorage.setItem(
    getLeadStorageKey(publicId),
    interestType,
  );
}

function readLeadInterest(publicId: string) {
  const savedValue =
    window.sessionStorage.getItem(
      getLeadStorageKey(publicId),
    );

  return savedValue === "high_savings_follow_up" ||
    savedValue === "notify_me"
    ? savedValue
    : null;
}

function updateStoredAuditMeta(
  meta: AuditMeta,
  share?: ShareMeta | null,
) {
  const saved =
    window.sessionStorage.getItem(
      AUDIT_RESULTS_KEY,
    );

  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved) as AuditResponse;
    window.sessionStorage.setItem(
      AUDIT_RESULTS_KEY,
      JSON.stringify({
        ...parsed,
        meta,
        share: share ?? parsed.share ?? null,
      }),
    );
  } catch (error) {
    console.error(
      "Unable to update stored audit meta.",
      error,
    );
  }
}

const Results = () => {
  const navigate = useNavigate();
  const [report, setReport] =
    useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [llmResponse, setLLMResponse] =
    useState<string>("");
  const [auditMeta, setAuditMeta] =
    useState<AuditMeta | null>(null);
  const [shareMeta, setShareMeta] =
    useState<ShareMeta | null>(null);
  const [isCopyingShareUrl, setIsCopyingShareUrl] =
    useState(false);
  const [leadEmail, setLeadEmail] =
    useState("");
  const [leadCompanyName, setLeadCompanyName] =
    useState("");
  const [leadConfirmedType, setLeadConfirmedType] =
    useState<LeadInterestType | null>(null);
  const [submittingLeadType, setSubmittingLeadType] =
    useState<LeadInterestType | null>(null);

  useEffect(() => {
    const saved =
      window.sessionStorage.getItem(
        AUDIT_RESULTS_KEY,
      );

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuditResponse;
        setReport(parsed.data);
        setLLMResponse(parsed.LLMResponse || "");
        setAuditMeta(parsed.meta || null);
        setShareMeta(parsed.share || null);
        setLeadEmail(parsed.meta?.email || "");
        setLeadCompanyName(
          parsed.meta?.companyName || "",
        );

        if (parsed.share?.publicId) {
          setLeadConfirmedType(
            readLeadInterest(parsed.share.publicId),
          );
        }
      } catch {
        toast.error(
          "Failed to load audit results. Redirecting to audit...",
        );
        setTimeout(
          () => navigate("/audit"),
          2000,
        );
      }
    } else {
      toast.error(
        "No audit results found. Starting new audit...",
      );
      setTimeout(
        () => navigate("/audit"),
        2000,
      );
    }

    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon
          className="animate-spin text-violet-400"
          size={48}
        />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const toolInsights = report.toolAudits.map(
    (toolAudit) => {
      const savings =
        toolAudit.error
          ? 0
          : getToolSavings(toolAudit);

      return {
        toolAudit,
        useCases: normalizeUseCases(
          toolAudit.useCases,
        ),
        currentCost:
          toolAudit.currentMonthlySpend,
        recommendedCost:
          getAlternativeCost(
            toolAudit.bestAlternative,
          ),
        savings,
        action: buildRecommendedAction(
          toolAudit,
          savings,
        ),
        reason: buildReason(
          toolAudit,
          savings,
        ),
      };
    },
  );

  const totalPotentialSavings =
    toolInsights.reduce(
      (total, toolInsight) =>
        total + toolInsight.savings,
      0,
    );
  const totalAnnualSavings =
    totalPotentialSavings * 12;
  const savingsPercent =
    report.summary.totalMonthlySpend > 0
      ? Math.round(
          (totalPotentialSavings /
            report.summary.totalMonthlySpend) *
            100,
        )
      : 0;
  const toolsWithSavings =
    toolInsights.filter(
      (toolInsight) => toolInsight.savings > 0,
    );
  const isAlreadyOptimal =
    toolsWithSavings.length === 0;
  const savingsTier: SavingsTier =
    totalPotentialSavings >
    HIGH_SAVINGS_THRESHOLD
      ? "high"
      : totalPotentialSavings <
            HONEST_SAVINGS_THRESHOLD ||
          isAlreadyOptimal
        ? "efficient"
        : "moderate";
  const topMoves = [...toolsWithSavings]
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3);

  const heroEyebrow =
    savingsTier === "high"
      ? "High savings detected"
      : savingsTier === "efficient"
        ? "Efficient stack"
        : "Actionable savings found";
  const heroTitle =
    savingsTier === "high"
      ? "There is real money to recover here."
      : savingsTier === "efficient"
        ? "You're spending well."
        : "A few smart moves can trim this stack.";
  const heroBody =
    savingsTier === "high"
      ? `This audit found ${formatCurrency(
          totalPotentialSavings,
          "compact",
        )}/mo in matched savings opportunities. Credex should be the path to capture it cleanly.`
      : savingsTier === "efficient"
        ? isAlreadyOptimal
          ? "We did not find a cheaper matched configuration for the tools and use cases in this audit."
          : "There are a few small trims available, but nothing material enough to overstate. Your stack is already in a healthy range."
        : `There is still meaningful spend to clean up here: about ${formatCurrency(
            totalPotentialSavings,
            "compact",
          )}/mo, or ${savingsPercent}% of current monthly spend.`;
  const leadCaptureAvailable =
    Boolean(shareMeta?.publicId);
  const sharePersistenceNote =
    shareMeta?.storage === "supabase"
      ? "Saved in Supabase so the public link survives backend restarts."
      : shareMeta?.storage === "memory"
        ? "Stored in memory for the current backend session."
        : "";

  const handleCopyShareLink = async () => {
    if (!shareMeta?.publicUrl || isCopyingShareUrl) {
      return;
    }

    setIsCopyingShareUrl(true);

    try {
      await navigator.clipboard.writeText(
        shareMeta.publicUrl,
      );
      toast.success("Public audit link copied.");
    } catch {
      toast.error(
        "Unable to copy the share link.",
      );
    } finally {
      setIsCopyingShareUrl(false);
    }
  };

  const handleLeadCapture = async (
    interestType: LeadInterestType,
  ) => {
    if (submittingLeadType) {
      return;
    }

    if (!leadEmail.trim()) {
      toast.error(
        "Add an email so we know where to reach you.",
      );
      return;
    }

    if (!shareMeta?.publicId) {
      toast.error(
        "This audit is missing its identifier. Please rerun the audit and try again.",
      );
      return;
    }

    setSubmittingLeadType(interestType);

    try {
      const response =
        await axiosInstance.post<LeadCaptureResponse>(
          "/tools/audit/lead",
          {
            publicId: shareMeta.publicId,
            email: leadEmail.trim(),
            companyName:
              leadCompanyName.trim() || undefined,
            interestType,
          },
        );

      const nextMeta = {
        companyName:
          response.data.meta?.companyName ??
          (leadCompanyName.trim() || null),
        email:
          response.data.meta?.email ??
          leadEmail.trim(),
      };

      setAuditMeta(nextMeta);
      setLeadEmail(nextMeta.email || "");
      setLeadCompanyName(
        nextMeta.companyName || "",
      );

      if (response.data.share) {
        setShareMeta(response.data.share);
      }

      setLeadConfirmedType(interestType);
      persistLeadInterest(
        shareMeta.publicId,
        interestType,
      );
      updateStoredAuditMeta(
        nextMeta,
        response.data.share || shareMeta,
      );

      toast.success(
        interestType ===
          "high_savings_follow_up"
          ? "Credex follow-up requested."
          : "We’ll notify you about future optimizations.",
      );
    } catch (error) {
      console.error(
        "Unable to save lead capture request.",
        error,
      );
      toast.error(
        "Unable to save that request right now.",
      );
    } finally {
      setSubmittingLeadType(null);
    }
  };

  const showHighSavingsSuccess =
    leadConfirmedType ===
    "high_savings_follow_up";
  const showNotifySuccess =
    leadConfirmedType === "notify_me";

  return (
    <div className="relative min-h-screen overflow-hidden pt-24 pb-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-[120%] rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="absolute top-10 right-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-500/8 blur-3xl" />
      </div>

      <Container>
        <div className="relative mx-auto max-w-7xl">
          <button
            onClick={() => navigate("/audit")}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:border-violet-400/30 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Audit
          </button>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.22),_transparent_42%),linear-gradient(145deg,rgba(9,9,11,0.97),rgba(12,12,18,0.92))] p-7 shadow-[0_24px_80px_rgba(3,7,18,0.45)] lg:p-10">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">
                {heroEyebrow}
              </div>

              <div className="max-w-4xl">
                <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
                  {heroTitle}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300 md:text-lg">
                  {heroBody}
                </p>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-[1.3fr_1fr]">
                <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-emerald-200/80">
                    Total Monthly Savings
                  </p>
                  <p className="mt-3 text-5xl font-semibold tracking-tight text-white md:text-7xl">
                    {formatCurrency(
                      totalPotentialSavings,
                      "compact",
                    )}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-emerald-100/80">
                    Potential monthly savings across{" "}
                    {report.summary.numberOfTools}{" "}
                    analyzed tool
                    {report.summary.numberOfTools === 1
                      ? ""
                      : "s"}
                    .
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm uppercase tracking-[0.22em] text-zinc-400">
                      Total Annual Savings
                    </p>
                    <p className="mt-3 text-4xl font-semibold text-white md:text-5xl">
                      {formatCurrency(
                        totalAnnualSavings,
                        "compact",
                      )}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Current Spend
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {formatCurrency(
                          report.summary
                            .totalMonthlySpend,
                          "precise",
                        )}
                        <span className="ml-1 text-sm font-normal text-zinc-400">
                          /mo
                        </span>
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Tools Reviewed
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {report.summary.numberOfTools}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {report.overallRecommendations[0] && (
                <div className="mt-8 flex gap-3 rounded-[28px] border border-violet-400/20 bg-violet-500/10 p-5">
                  <Zap
                    className="mt-1 flex-shrink-0 text-violet-300"
                    size={20}
                  />
                  <p className="text-sm leading-7 text-violet-100/85">
                    {report.overallRecommendations[0]}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-6">
              {savingsTier === "high" ? (
                <div className="rounded-[30px] border border-emerald-400/25 bg-[linear-gradient(160deg,rgba(6,95,70,0.34),rgba(9,9,11,0.95))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-200/85">
                    Capture It With Credex
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold text-white">
                    Credex should own this follow-through.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-emerald-50/85">
                    Savings above{" "}
                    {formatCurrency(
                      HIGH_SAVINGS_THRESHOLD,
                      "compact",
                    )}
                    /mo are worth active follow-up. Credex can help
                    your team capture this without the rollout friction
                    that usually slows these changes down.
                  </p>

                  {showHighSavingsSuccess ? (
                    <div className="mt-6 rounded-[24px] border border-emerald-300/25 bg-black/25 p-5">
                      <p className="text-sm font-semibold text-white">
                        Credex follow-up requested
                      </p>
                      <p className="mt-2 text-sm leading-7 text-emerald-50/80">
                        We’ll use{" "}
                        <span className="font-medium text-white">
                          {leadEmail}
                        </span>{" "}
                        to reach out about this audit.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-[24px] border border-white/10 bg-black/25 p-5">
                      {!auditMeta?.email && (
                        <input
                          type="email"
                          value={leadEmail}
                          onChange={(event) =>
                            setLeadEmail(
                              event.target.value,
                            )
                          }
                          placeholder="Work email"
                          className="mb-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-emerald-300/50 focus:outline-none"
                        />
                      )}

                      {auditMeta?.email && (
                        <p className="mb-4 text-sm text-emerald-100/80">
                          Follow-up will go to{" "}
                          <span className="font-medium text-white">
                            {auditMeta.email}
                          </span>
                          .
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleLeadCapture(
                            "high_savings_follow_up",
                          )
                        }
                        disabled={
                          !leadCaptureAvailable ||
                          submittingLeadType ===
                            "high_savings_follow_up"
                        }
                        className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-zinc-400"
                      >
                        {submittingLeadType ===
                        "high_savings_follow_up"
                          ? "Saving request..."
                          : "Have Credex Reach Out"}
                      </button>

                      {!leadCaptureAvailable && (
                        <p className="mt-3 text-xs text-amber-200/80">
                          This audit link is missing, so follow-up
                          cannot be saved yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : savingsTier === "efficient" ? (
                <div className="rounded-[30px] border border-sky-400/18 bg-[linear-gradient(160deg,rgba(12,20,35,0.96),rgba(5,18,31,0.92))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
                  <p className="text-sm uppercase tracking-[0.24em] text-sky-200/80">
                    Honest Read
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold text-white">
                    You’re spending well.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    We are not going to manufacture savings that are not
                    there. If fresh pricing or better-fit plans show up
                    later, we can notify you.
                  </p>

                  {showNotifySuccess ? (
                    <div className="mt-6 rounded-[24px] border border-sky-300/20 bg-black/25 p-5">
                      <p className="text-sm font-semibold text-white">
                        Optimization watch enabled
                      </p>
                      <p className="mt-2 text-sm leading-7 text-zinc-300">
                        We’ll watch this stack and notify{" "}
                        <span className="font-medium text-white">
                          {leadEmail}
                        </span>{" "}
                        when a new matched opportunity appears.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-[24px] border border-white/10 bg-black/25 p-5">
                      {!auditMeta?.email && (
                        <input
                          type="email"
                          value={leadEmail}
                          onChange={(event) =>
                            setLeadEmail(
                              event.target.value,
                            )
                          }
                          placeholder="Work email"
                          className="mb-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-sky-300/50 focus:outline-none"
                        />
                      )}

                      {auditMeta?.email && (
                        <p className="mb-4 text-sm text-zinc-300">
                          We already have{" "}
                          <span className="font-medium text-white">
                            {auditMeta.email}
                          </span>
                          .
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleLeadCapture(
                            "notify_me",
                          )
                        }
                        disabled={
                          !leadCaptureAvailable ||
                          submittingLeadType ===
                            "notify_me"
                        }
                        className="w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-400"
                      >
                        {submittingLeadType ===
                        "notify_me"
                          ? "Saving request..."
                          : "Notify Me When New Optimizations Apply"}
                      </button>

                      {!leadCaptureAvailable && (
                        <p className="mt-3 text-xs text-amber-200/80">
                          This audit link is missing, so the notify
                          request cannot be saved yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[30px] border border-violet-400/18 bg-[linear-gradient(160deg,rgba(38,20,58,0.75),rgba(9,9,11,0.96))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
                  <p className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                    Best Next Moves
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold text-white">
                    Start with the biggest trims first.
                  </h2>
                  <div className="mt-6 space-y-3">
                    {topMoves.map((move) => (
                      <div
                        key={`${move.toolAudit.toolName}-${move.action}`}
                        className="rounded-2xl border border-white/10 bg-black/25 p-4"
                      >
                        <p className="text-sm font-semibold text-white">
                          {move.toolAudit.toolName}
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          {move.action}
                        </p>
                        <p className="mt-2 text-sm font-medium text-emerald-300">
                          {formatCurrency(
                            move.savings,
                            "precise",
                          )}
                          /mo savings
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,16,20,0.95),rgba(8,8,10,0.9))] p-6">
                <div className="flex items-start gap-3">
                  <Link2
                    className="mt-1 flex-shrink-0 text-violet-300"
                    size={18}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                      Share-Ready Link
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      Redacted public version
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">
                      This is the version people can screenshot and pass
                      around. It keeps tools, spend, and savings visible
                      while hiding company name and email.
                    </p>
                  </div>
                </div>

                {shareMeta ? (
                  <>
                    <div className="mt-5 break-all rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
                      {shareMeta.publicUrl}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleCopyShareLink}
                        className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 cursor-pointer"
                      >
                        <Copy size={16} />
                        {isCopyingShareUrl
                          ? "Copying..."
                          : "Copy Link"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            shareMeta.publicUrl,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 cursor-pointer"
                      >
                        <ArrowUpRight size={16} />
                        Open Public Page
                      </button>
                    </div>

                    {sharePersistenceNote && (
                      <p
                        className={`mt-4 text-xs leading-6 ${
                          shareMeta.storage === "memory"
                            ? "text-amber-200/80"
                            : "text-emerald-200/80"
                        }`}
                      >
                        {sharePersistenceNote}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
                    The public share link was not created for this audit.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-start gap-3">
                <TrendingDown
                  className="mt-1 flex-shrink-0 text-emerald-300"
                  size={18}
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-emerald-200/80">
                    Snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    What this audit says in one glance
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    Current stack spend is{" "}
                    <span className="font-medium text-white">
                      {formatCurrency(
                        report.summary
                          .totalMonthlySpend,
                        "precise",
                      )}
                      /mo
                    </span>
                    , with{" "}
                    <span className="font-medium text-white">
                      {formatCurrency(
                        totalPotentialSavings,
                        "precise",
                      )}
                      /mo
                    </span>{" "}
                    in matched savings opportunities.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-1 flex-shrink-0 text-emerald-300"
                  size={18}
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-emerald-200/80">
                    Privacy
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Identity stays private
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    Public shares never render company name or email.
                    {auditMeta?.companyName ||
                    auditMeta?.email
                      ? ` Private details saved for this audit: ${[
                          auditMeta.companyName,
                          auditMeta.email,
                        ]
                          .filter(Boolean)
                          .join(" · ")}.`
                      : " No identifying details were stored with this audit."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
                  Per-Tool Breakdown
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Current spend, action, and savings
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              {toolInsights.map(
                (
                  {
                    toolAudit,
                    useCases,
                    currentCost,
                    recommendedCost,
                    savings,
                    action,
                    reason,
                  },
                  index,
                ) => (
                  <article
                    key={`${toolAudit.toolName}-${index}`}
                    className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.92),rgba(8,8,10,0.98))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
                  >
                    <div className="mb-5 flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-semibold text-white">
                            {toolAudit.toolName}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              savings > 0
                                ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                                : "border border-sky-400/20 bg-sky-500/10 text-sky-100"
                            }`}
                          >
                            {savings > 0
                              ? "Savings found"
                              : "Spending well"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">
                          Current plan: {toolAudit.currentPlan}
                        </p>
                      </div>

                      {useCases.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {useCases.map((useCase) => (
                            <span
                              key={`${toolAudit.toolName}-${useCase}`}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-zinc-300"
                            >
                              {useCase}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {toolAudit.error ? (
                      <div className="rounded-[24px] border border-rose-400/25 bg-rose-500/10 p-5 text-sm leading-7 text-rose-100">
                        {toolAudit.error}
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.25fr_0.9fr]">
                        <div className="rounded-[26px] border border-white/10 bg-black/25 p-5">
                          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                            Current Spend
                          </p>
                          <p className="mt-3 text-4xl font-semibold text-white">
                            {formatCurrency(
                              currentCost,
                              "precise",
                            )}
                          </p>
                          <p className="mt-2 text-sm text-zinc-400">
                            per month on{" "}
                            {toolAudit.currentPlan}
                          </p>
                        </div>

                        <div
                          className={`rounded-[26px] border p-5 ${
                            savings > 0
                              ? "border-emerald-400/20 bg-emerald-500/10"
                              : "border-sky-400/18 bg-sky-500/8"
                          }`}
                        >
                          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
                            Recommended Action
                          </p>
                          <h4 className="mt-3 text-2xl font-semibold text-white">
                            {action}
                          </h4>
                          <p className="mt-3 text-sm leading-7 text-zinc-200/85">
                            {reason}
                          </p>

                          {toolAudit.bestAlternative &&
                            savings > 0 && (
                              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-sm text-zinc-400">
                                  New projected spend
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-white">
                                  <span className="text-lg font-medium">
                                    {formatCurrency(
                                      currentCost,
                                      "precise",
                                    )}
                                  </span>
                                  <span className="text-zinc-500">
                                    →
                                  </span>
                                  <span className="text-lg font-medium">
                                    {formatCurrency(
                                      recommendedCost,
                                      "precise",
                                    )}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs text-zinc-400">
                                  {toolAudit.bestAlternative.toolName}{" "}
                                  {toolAudit.bestAlternative.planName}
                                  {" · "}
                                  {
                                    toolAudit.bestAlternative
                                      .priceLabel
                                  }
                                </p>
                              </div>
                            )}

                          {toolAudit.alternatives.length >
                            1 && (
                            <div className="mt-5">
                              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                                Other viable options
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {toolAudit.alternatives
                                  .slice(1, 4)
                                  .map((alternative) => (
                                    <span
                                      key={`${toolAudit.toolName}-${alternative.toolName}-${alternative.planName}`}
                                      className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300"
                                    >
                                      {alternative.toolName}{" "}
                                      {alternative.planName}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rounded-[26px] border border-white/10 bg-black/25 p-5">
                          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                            Savings Impact
                          </p>
                          <p
                            className={`mt-3 text-4xl font-semibold ${
                              savings > 0
                                ? "text-emerald-300"
                                : "text-sky-100"
                            }`}
                          >
                            {savings > 0
                              ? formatCurrency(
                                  savings,
                                  "precise",
                                )
                              : formatCurrency(
                                  0,
                                  "precise",
                                )}
                          </p>
                          <p className="mt-2 text-sm text-zinc-400">
                            {savings > 0
                              ? "per month"
                              : "No matched savings"}
                          </p>
                          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                              Annual view
                            </p>
                            <p className="mt-2 text-lg font-medium text-white">
                              {formatCurrency(
                                savings * 12,
                                "precise",
                              )}
                              {savings > 0
                                ? " / year"
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                ),
              )}
            </div>
          </section>

          {llmResponse && (
            <section className="mt-14 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,20,0.92),rgba(8,8,10,0.98))] p-7">
              <div className="mb-4 flex items-start gap-3">
                <Zap
                  className="mt-1 flex-shrink-0 text-violet-300"
                  size={18}
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-violet-200/80">
                    AI Summary
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Narrative readout
                  </h2>
                </div>
              </div>
              <div className="max-w-4xl text-sm leading-8 whitespace-pre-wrap text-zinc-300">
                {llmResponse}
              </div>
            </section>
          )}

          <div className="mt-12 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/audit")}
              className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 cursor-pointer"
            >
              Run Another Audit
            </button>

            {shareMeta && (
              <button
                onClick={handleCopyShareLink}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 cursor-pointer"
              >
                Copy Public Link
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 cursor-pointer"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Results;
