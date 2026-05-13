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

const PublicAudit = () => {
  const { publicId } = useParams();
  const [report, setReport] =
    useState<PublicAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
              {report.shareCard.title}
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed mt-5 max-w-3xl">
              {report.shareCard.description}
            </p>

            <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-black/35 border border-white/10 text-sm text-zinc-300">
              <ShieldCheck
                size={16}
                className="text-emerald-400"
              />
              Company name and email are removed from this public page.
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">
                Current Monthly Spend
              </p>
              <p className="text-3xl font-bold text-white">
                ${report.summary.totalMonthlySpend.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">
                Annual Spend
              </p>
              <p className="text-3xl font-bold text-white">
                ${report.summary.totalAnnualSpend.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">
                Potential Monthly Savings
              </p>
              <p className="text-3xl font-bold text-emerald-400">
                $
                {report.shareCard.totalPotentialSavings.toFixed(
                  2
                )}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">
                Tools Analyzed
              </p>
              <p className="text-3xl font-bold text-white">
                {report.summary.numberOfTools}
              </p>
            </div>
          </div>

          {report.overallRecommendations[0] && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
              <p className="text-sm uppercase tracking-[0.22em] text-violet-300/80 mb-2">
                Recommendation
              </p>
              <p className="text-zinc-200 leading-relaxed">
                {report.overallRecommendations[0]}
              </p>
            </div>
          )}

          <div className="space-y-5 mb-8">
            {report.toolAudits.map((toolAudit, index) => {
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
                                (useCase) => (
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
