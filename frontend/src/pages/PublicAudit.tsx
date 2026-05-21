import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  LoaderIcon,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import Container from "../components/layout/Container";
import { axiosInstance } from "../lib/axios";

interface Alternative {
  toolName: string;
  planName: string;
  monthlyCost?: number;
  estimatedMonthlyCost?: number;
  priceLabel: string;
}

interface ToolAudit {
  toolName: string;
  currentPlan: string;
  currentMonthlySpend: number;
  useCases: string[];
  hasCheaperAlternative: boolean;
  bestAlternative: Alternative | null;
  error?: string;
}

interface PublicAuditReport {
  publicId: string;
  publicUrl: string;
  createdAt: string;
  summary: {
    totalMonthlySpend: number;
    totalAnnualSpend: number;
    numberOfTools: number;
  };
  overallRecommendations: string[];
  toolAudits: ToolAudit[];
  llmResponse?: string;
  shareCard: {
    title: string;
    description: string;
    totalPotentialSavings: number;
    annualPotentialSavings: number;
  };
}

function getToolPotentialSavings(toolAudit: ToolAudit) {
  const nextCost =
    toolAudit.bestAlternative?.monthlyCost ??
    toolAudit.bestAlternative?.estimatedMonthlyCost ??
    0;

  return Math.max((toolAudit.currentMonthlySpend || 0) - nextCost, 0);
}

function buildCurrentReportSummary(toolAudits: ToolAudit[]) {
  const totalMonthlySpend = toolAudits.reduce(
    (sum, toolAudit) => sum + (toolAudit.currentMonthlySpend || 0),
    0,
  );
  const totalPotentialSavings = toolAudits.reduce(
    (sum, toolAudit) => sum + getToolPotentialSavings(toolAudit),
    0,
  );

  return {
    summary: {
      totalMonthlySpend,
      totalAnnualSpend: totalMonthlySpend * 12,
      numberOfTools: toolAudits.length,
    },
    totalPotentialSavings,
  };
}

const PublicAudit = () => {
  const { publicId } = useParams();
  const [report, setReport] =
    useState<PublicAuditReport | null>(null);
  const [internalAudit, setInternalAudit] =
    useState<{ invalidated: boolean; changeSummary?: any } | null>(
      null,
    );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const currentReportToolAudits =
    internalAudit?.invalidated &&
    internalAudit.changeSummary?.currentReport?.toolAudits
      ? internalAudit.changeSummary.currentReport.toolAudits
      : null;

  const currentReportSummary =
    currentReportToolAudits &&
    currentReportToolAudits.length > 0
      ? buildCurrentReportSummary(currentReportToolAudits)
      : null;

  const displayReport = report
    ? currentReportSummary && currentReportToolAudits
      ? {
          ...report,
          toolAudits: currentReportToolAudits,
          overallRecommendations:
            internalAudit?.changeSummary?.currentReport
              ?.overallRecommendations || report.overallRecommendations,
          summary: currentReportSummary.summary,
          shareCard: {
            ...report.shareCard,
            totalPotentialSavings:
              currentReportSummary.totalPotentialSavings,
          },
        }
      : report
    : null;

  const visibleReport = (displayReport || report) as PublicAuditReport;

  useEffect(() => {
    if (!publicId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response =
          await axiosInstance.get(
            `/public/audits/${publicId}`,
            {
              signal: controller.signal,
            }
          );
        const nextReport =
          response.data as PublicAuditReport;

        setReport(nextReport);
        document.title = nextReport.shareCard.title;

        const descriptionTag =
          document.querySelector(
            'meta[name="description"]'
          );

        if (descriptionTag) {
          descriptionTag.setAttribute(
            "content",
            nextReport.shareCard.description
          );
        }
      } catch (error: unknown) {
        const err = error as {
          name?: string;
          code?: string;
          response?: { status?: number };
        };

        if (
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (err?.response?.status === 404) {
          setNotFound(true);
          return;
        }

        toast.error(
          "Unable to load the public audit."
        );
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [publicId]);

  useEffect(() => {
    if (!publicId) {
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response = await axiosInstance.get(
          `/tools/audit/${publicId}`,
          {
            signal: controller.signal,
          },
        );

        setInternalAudit(response.data);
      } catch (error: unknown) {
        const err = error as {
          name?: string;
          code?: string;
          response?: { status?: number };
        };

        if (
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED"
        ) {
          return;
        }

      }
    })();

    return () => controller.abort();
  }, [publicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon
          className="animate-spin text-violet-500"
          size={48}
        />
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen flex items-center">
        <Container>
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center">
            <h1 className="text-4xl font-bold text-white">
              Public audit not found
            </h1>
            <p className="text-zinc-400 mt-4 leading-relaxed">
              This shared audit may have expired,
              been removed, or never existed.
            </p>
            <Link
              to="/audit"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-2xl font-semibold text-white transition"
            >
              Start a new audit
              <ArrowRight size={18} />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <Container>
        <div className="max-w-6xl mx-auto">
          <div className="bg-linear-to-br from-violet-900/25 via-zinc-950 to-emerald-900/15 border border-violet-400/20 rounded-[2rem] p-8 lg:p-10 mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-violet-300/80 mb-3">
              Public AI Spend Audit
            </p>
            <h1 className="text-4xl lg:text-6xl font-bold text-white max-w-4xl">
              {visibleReport?.shareCard.title}
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed mt-5 max-w-3xl">
              {visibleReport?.shareCard.description}
            </p>

            <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-black/35 border border-white/10 text-sm text-zinc-300">
              <ShieldCheck
                size={16}
                className="text-emerald-400"
              />
              Company name and email are removed from this public page.
            </div>
          </div>

          {internalAudit?.invalidated && internalAudit.changeSummary && (
            <div className="bg-amber-900/10 border border-amber-600 rounded-3xl p-6 mb-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-amber-300">
                    Audit updated
                  </p>
                  <h2 className="text-2xl font-semibold text-amber-50">
                    Pricing or recommendations changed.
                  </h2>
                  <p className="mt-2 text-amber-200 text-sm max-w-3xl">
                    This shared audit was invalidated after a pricing refresh. Review the diff and rerun to see fresh guidance.
                  </p>
                </div>
                <Link
                  to={`/audit/diff/${publicId}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  View diff & rerun
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-black/20 border border-amber-600 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                    Pricing updates
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {internalAudit.changeSummary.pricingDiff?.changes?.length || 0}
                  </p>
                </div>
                <div className="rounded-3xl bg-black/20 border border-amber-600 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                    Recommendation change
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {internalAudit.changeSummary.recommendationDiff?.changed ? "Yes" : "No"}
                  </p>
                </div>
                <div className="rounded-3xl bg-black/20 border border-amber-600 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                    Savings delta
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    ${internalAudit.changeSummary.savingsDelta?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl bg-black/20 border border-amber-600 p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-amber-200 mb-3">
                    Previous recommendation
                  </p>
                  <p className="text-white">
                    {internalAudit.changeSummary.previousReport?.overallRecommendations?.[0] || "No recommendation available."}
                  </p>
                </div>
                <div className="rounded-3xl bg-black/20 border border-amber-600 p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-amber-200 mb-3">
                    Updated recommendation
                  </p>
                  <p className="text-white">
                    {internalAudit.changeSummary.currentReport?.overallRecommendations?.[0] || "No recommendation available."}
                  </p>
                </div>
              </div>

              {internalAudit.changeSummary.pricingDiff?.changes?.length > 0 ? (
                <div className="mt-6 rounded-3xl bg-black/20 border border-amber-600 p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-amber-200 mb-4">
                    Changed pricing items
                  </p>
                  <ul className="space-y-3 text-white">
                    {internalAudit.changeSummary.pricingDiff.changes.map((change: any, index: number) => (
                      <li
                        key={`${change.toolId}-${index}`}
                        className="rounded-2xl bg-zinc-950/80 border border-amber-700 p-4"
                      >
                        <p className="font-semibold">
                          {change.toolName || change.toolId}
                        </p>
                        <p className="mt-1 text-sm text-amber-200">
                          {change.type === "price_changed"
                            ? `${change.planName || "Plan"} price changed from $${(change.oldPrice ?? 0).toFixed(2)} to $${(change.newPrice ?? 0).toFixed(2)}`
                            : change.type === "plan_added"
                            ? `New plan added: ${change.planName}`
                            : change.type === "plan_removed"
                            ? `Plan removed: ${change.planName}`
                            : change.type === "tool_added"
                            ? "New tool added"
                            : change.type === "tool_removed"
                            ? "Tool removed"
                            : "Pricing change detected"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : internalAudit.changeSummary.reportChanged ? (
                <div className="mt-6 rounded-3xl bg-black/20 border border-amber-600 p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-amber-200 mb-3">
                    Why this audit changed
                  </p>
                  <p className="text-amber-100">
                    The pricing data stayed the same, but the audit output changed enough to update the recommendation.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">
                Current Monthly Spend
              </p>
              <p className="text-3xl font-bold text-white">
                ${visibleReport.summary.totalMonthlySpend.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">
                Annual Spend
              </p>
              <p className="text-3xl font-bold text-white">
                ${visibleReport.summary.totalAnnualSpend.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">
                Potential Monthly Savings
              </p>
              <p className="text-3xl font-bold text-emerald-400">
                $
                {visibleReport.shareCard.totalPotentialSavings.toFixed(
                  2
                )}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">
                Tools Analyzed
              </p>
              <p className="text-3xl font-bold text-white">
                {visibleReport.summary.numberOfTools}
              </p>
            </div>
          </div>

          {visibleReport.overallRecommendations[0] && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
              <p className="text-sm uppercase tracking-[0.22em] text-violet-300/80 mb-2">
                Recommendation
              </p>
              <p className="text-zinc-200 leading-relaxed">
                {visibleReport.overallRecommendations[0]}
              </p>
            </div>
          )}

          <div className="space-y-5 mb-8">
            {visibleReport.toolAudits.map((toolAudit: ToolAudit, index: number) => {
              const nextCost =
                toolAudit.bestAlternative
                  ?.monthlyCost ||
                toolAudit.bestAlternative
                  ?.estimatedMonthlyCost ||
                0;
              const savings = Math.max(
                toolAudit.currentMonthlySpend -
                  nextCost,
                0
              );

              return (
                <div
                  key={`${toolAudit.toolName}-${index}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                >
                  {toolAudit.error ? (
                    <p className="text-red-400">
                      {toolAudit.error}
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                          <h2 className="text-2xl font-bold text-white">
                            {toolAudit.toolName}
                          </h2>
                          <p className="text-zinc-400 mt-1">
                            Current plan:{" "}
                            {toolAudit.currentPlan}
                          </p>

                          {toolAudit.useCases.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {toolAudit.useCases.map(
                                (useCase: string) => (
                                  <span
                                    key={useCase}
                                    className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 capitalize"
                                  >
                                    {useCase}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-zinc-400 mb-1">
                            Current spend
                          </p>
                          <p className="text-2xl font-bold text-white">
                            $
                            {toolAudit.currentMonthlySpend.toFixed(
                              2
                            )}
                          </p>
                        </div>
                      </div>

                      {toolAudit.hasCheaperAlternative &&
                      toolAudit.bestAlternative ? (
                        <div className="mt-5 bg-black/35 border border-emerald-500/25 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <TrendingDown className="text-emerald-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <p className="text-sm text-zinc-400 mb-1">
                                Best alternative
                              </p>
                              <p className="font-semibold text-white">
                                {
                                  toolAudit
                                    .bestAlternative
                                    .toolName
                                }{" "}
                                -{" "}
                                {
                                  toolAudit
                                    .bestAlternative
                                    .planName
                                }
                              </p>
                              <p className="text-xs text-zinc-400 mt-1">
                                {
                                  toolAudit
                                    .bestAlternative
                                    .priceLabel
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-zinc-400 mb-1">
                                New cost
                              </p>
                              <p className="text-xl font-bold text-white">
                                ${nextCost.toFixed(2)}
                              </p>
                              {savings > 0 && (
                                <p className="text-emerald-400 font-semibold text-sm mt-1">
                                  Save $
                                  {savings.toFixed(2)}
                                  /mo
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 bg-black/30 border border-zinc-800 rounded-2xl p-4">
                          <p className="text-zinc-400 text-sm">
                            No cheaper matched alternative
                            found for this tool.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {report.llmResponse && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
              <p className="text-sm uppercase tracking-[0.22em] text-violet-300/80 mb-3">
                AI Analysis
              </p>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {report.llmResponse}
              </p>
            </div>
          )}

          <div className="bg-linear-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-violet-300/80 mb-2">
                Run Your Own
              </p>
              <h2 className="text-2xl font-bold text-white">
                Audit your AI stack and share it in one link
              </h2>
            </div>

            <Link
              to="/audit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-2xl font-semibold text-white transition"
            >
              Start Audit
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PublicAudit;
