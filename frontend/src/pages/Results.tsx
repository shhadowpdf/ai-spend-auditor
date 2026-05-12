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
  useCases: string[];
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

const Results = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [llmResponse, setLLMResponse] = useState<string>("");
  const [auditMeta, setAuditMeta] = useState<AuditMeta | null>(null);
  const [shareMeta, setShareMeta] = useState<ShareMeta | null>(null);
  const [isCopyingShareUrl, setIsCopyingShareUrl] = useState(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("audit-results");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuditResponse;
        setReport(parsed.data);
        setLLMResponse(parsed.LLMResponse || "");
        setAuditMeta(parsed.meta || null);
        setShareMeta(parsed.share || null);
      } catch {
        toast.error("Failed to load audit results. Redirecting to audit...");
        setTimeout(() => navigate("/audit"), 2000);
      }
    } else {
      toast.error("No audit results found. Starting new audit...");
      setTimeout(() => navigate("/audit"), 2000);
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="animate-spin text-violet-500" size={48} />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const totalPotentialSavings = report.toolAudits.reduce((acc, tool) => {
    if (tool.bestAlternative) {
      const savings =
        tool.currentMonthlySpend -
        (tool.bestAlternative.monthlyCost ||
          tool.bestAlternative.estimatedMonthlyCost ||
          0);
      return acc + Math.max(savings, 0);
    }
    return acc;
  }, 0);

  const handleCopyShareLink = async () => {
    if (!shareMeta?.publicUrl || isCopyingShareUrl) {
      return;
    }

    setIsCopyingShareUrl(true);

    try {
      await navigator.clipboard.writeText(shareMeta.publicUrl);
      toast.success("Public audit link copied.");
    } catch {
      toast.error("Unable to copy the share link.");
    } finally {
      setIsCopyingShareUrl(false);
    }
  };

  const sharePersistenceNote =
    shareMeta?.storage === "supabase"
      ? "This share link is persisted in Supabase and survives backend restarts."
      : shareMeta?.storage === "memory"
        ? "This share link is only stored in memory for the current server session."
        : "";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <Container>
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/audit")}
            className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition mb-8 cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back to Audit
          </button>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
              Your Audit Results
            </h1>
            <p className="text-zinc-400 text-lg">
              Analysis complete. Here's what we found.
            </p>
          </div>

          {shareMeta && (
            <div className="grid xl:grid-cols-[1.35fr_0.9fr] gap-4 mb-12">
              <div className="bg-linear-to-br from-violet-900/25 via-zinc-950 to-emerald-900/15 border border-violet-400/20 rounded-3xl p-6 lg:p-7">
                <div className="flex items-start gap-3 mb-5">
                  <Link2 className="text-violet-300 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-violet-300/80 mb-2">
                      Public Share Link
                    </p>
                    <h2 className="text-2xl font-bold text-white">
                      Share the redacted version
                    </h2>
                    <p className="text-zinc-300 mt-2 leading-relaxed">
                      Anyone with this link sees tools, recommendations, and
                      savings numbers. Identifying details stay private.
                    </p>
                  </div>
                </div>

                <div className="bg-black/35 border border-white/10 rounded-2xl p-4 text-sm text-zinc-300 break-all">
                  {shareMeta.publicUrl}
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 rounded-2xl font-semibold text-white transition cursor-pointer"
                  >
                    <Copy size={18} />
                    {isCopyingShareUrl ? "Copying..." : "Copy Link"}
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
                    className="inline-flex items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl font-semibold text-white transition cursor-pointer"
                  >
                    <ArrowUpRight size={18} />
                    Open Public Page
                  </button>
                </div>

                {sharePersistenceNote && (
                  <p
                    className={`text-xs mt-4 leading-relaxed ${
                      shareMeta.storage === "memory"
                        ? "text-amber-300/80"
                        : "text-emerald-300/80"
                    }`}
                  >
                    {sharePersistenceNote}
                  </p>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-7">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldCheck className="text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-emerald-300/80 mb-2">
                      Privacy Guardrail
                    </p>
                    <h2 className="text-xl font-bold text-white">
                      Public view stays anonymous
                    </h2>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
                  <p>The public page keeps the tool list, costs, and savings visible for easy sharing.</p>
                  <p>Company name and email are stored privately with the audit and never rendered on the shared page.</p>
                  {auditMeta?.companyName || auditMeta?.email ? (
                    <p className="text-zinc-400">
                      Private details captured for this audit:{" "}
                      {[auditMeta.companyName, auditMeta.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : (
                    <p className="text-zinc-400">
                      No identifying details were added to this audit.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">Current Monthly Spend</p>
              <p className="text-3xl font-bold text-white">
                ${report.summary.totalMonthlySpend.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">Annual Spend</p>
              <p className="text-3xl font-bold text-white">
                ${report.summary.totalAnnualSpend.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">Potential Monthly Savings</p>
              <p className="text-3xl font-bold text-emerald-400">
                ${totalPotentialSavings.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2">Tools Analyzed</p>
              <p className="text-3xl font-bold text-white">
                {report.summary.numberOfTools}
              </p>
            </div>
          </div>

          {/* Overall Recommendations */}
          {report.overallRecommendations.length > 0 && (
            <div className="bg-violet-900/20 border border-violet-500/30 rounded-2xl p-6 mb-12">
              <div className="flex gap-3">
                <Zap className="text-violet-400 flex-shrink-0" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Key Recommendation
                  </h3>
                  <p className="text-violet-200">
                    {report.overallRecommendations[0]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tool Audits */}
          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-white">Tool Analysis</h2>

            {report.toolAudits.map((toolAudit, index) => {
              const cost =
                toolAudit.bestAlternative?.monthlyCost ||
                toolAudit.bestAlternative?.estimatedMonthlyCost ||
                0;
              const savings = Math.max(toolAudit.currentMonthlySpend - cost, 0);

              return (
                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                >
                  {toolAudit.error ? (
                    <div className="text-red-400">{toolAudit.error}</div>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {toolAudit.toolName}
                          </h3>
                          <p className="text-zinc-400 text-sm mt-1">
                            Current Plan: {toolAudit.currentPlan}
                          </p>
                          {toolAudit.useCases.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {toolAudit.useCases.map((useCase) => (
                                <span
                                  key={useCase}
                                  className="inline-block bg-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300 capitalize"
                                >
                                  {useCase}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-zinc-400 mb-1">
                            Current Monthly Spend
                          </p>
                          <p className="text-2xl font-bold text-white">
                            ${toolAudit.currentMonthlySpend.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {toolAudit.hasCheaperAlternative &&
                      toolAudit.bestAlternative ? (
                        <div className="bg-black/40 border border-emerald-500/30 rounded-xl p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <TrendingDown className="text-emerald-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-zinc-400 mb-1">
                                Best Alternative
                              </p>
                              <p className="font-semibold text-white">
                                {toolAudit.bestAlternative.toolName} -{" "}
                                {toolAudit.bestAlternative.planName}
                              </p>
                              <p className="text-xs text-zinc-400 mt-1">
                                {toolAudit.bestAlternative.priceLabel}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-zinc-400 mb-1">
                                New Cost
                              </p>
                              <p className="text-xl font-bold text-white">
                                ${cost.toFixed(2)}
                              </p>
                              {savings > 0 && (
                                <p className="text-emerald-400 font-semibold text-sm mt-1">
                                  Save ${savings.toFixed(2)}/mo
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-black/40 border border-zinc-700 rounded-xl p-4">
                          <p className="text-zinc-400 text-sm">
                            ✓ No cheaper alternative found. Your current plan is
                            optimal for your use cases.
                          </p>
                        </div>
                      )}

                      {toolAudit.alternatives.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <p className="text-sm font-semibold text-zinc-300 mb-3">
                            Other Options
                          </p>
                          <div className="space-y-2">
                            {toolAudit.alternatives.slice(1).map((alt, i) => {
                              const altCost =
                                alt.monthlyCost || alt.estimatedMonthlyCost || 0;
                              return (
                                <div
                                  key={i}
                                  className="flex justify-between items-center text-sm bg-black/20 p-2 rounded-lg"
                                >
                                  <span className="text-zinc-400">
                                    {alt.toolName} - {alt.planName}
                                  </span>
                                  <span className="text-white font-semibold">
                                    ${altCost.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Analysis */}
          {llmResponse && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-12">
              <h2 className="text-xl font-bold text-white mb-4">AI Analysis</h2>
              <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {llmResponse}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/audit")}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-2xl font-semibold text-white transition cursor-pointer"
            >
              Run Another Audit
            </button>
            {shareMeta && (
              <button
                onClick={handleCopyShareLink}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-semibold text-white transition cursor-pointer"
              >
                Copy Public Link
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-semibold text-white transition cursor-pointer"
            >
              Download Report
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Results;
