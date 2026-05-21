import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, LoaderIcon, RefreshCcw, ShieldCheck } from "lucide-react";
import Container from "../components/layout/Container";
import { axiosInstance } from "../lib/axios";

interface PricingChange {
  toolId: string;
  toolName?: string;
  planId?: string;
  planName?: string;
  type: string;
  oldPrice?: number;
  newPrice?: number;
}

interface ChangeSummary {
  pricingDiff: {
    hasChanges: boolean;
    changes: PricingChange[];
  };
  reportChanged: boolean;
  recommendationDiff: {
    old: string | null;
    new: string | null;
    changed: boolean;
  };
  savingsDelta: number;
  previousSavings: number;
  currentSavings: number;
  previousReport: {
    overallRecommendations: string[];
    toolAudits: any[];
  };
  currentReport: {
    overallRecommendations: string[];
    toolAudits: any[];
  };
}

interface InternalAudit {
  auditId: string;
  invalidated: boolean;
  changeSummary?: ChangeSummary | null;
}

const formatPricingChange = (change: PricingChange) => {
  if (change.type === "tool_added") {
    return `New tool added: ${change.toolName || change.toolId}`;
  }

  if (change.type === "tool_removed") {
    return `Tool removed: ${change.toolName || change.toolId}`;
  }

  if (change.type === "plan_added") {
    return `New plan added for ${change.toolName}: ${change.planName}`;
  }

  if (change.type === "plan_removed") {
    return `Plan removed for ${change.toolName}: ${change.planName}`;
  }

  if (change.type === "price_changed") {
    const oldValue = change.oldPrice ?? 0;
    const newValue = change.newPrice ?? 0;
    return `${change.toolName || change.toolId} plan ${change.planName} price changed from $${oldValue.toFixed(2)} to $${newValue.toFixed(2)}`;
  }

  return `${change.toolName || change.toolId} changed`;
};

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const AuditDiff = () => {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<InternalAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerunLoading, setRerunLoading] = useState(false);
  const [rerunResult, setRerunResult] = useState<any>(null);

  useEffect(() => {
    if (!auditId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response = await axiosInstance.get(
          `/tools/audit/${auditId}`,
          { signal: controller.signal },
        );
        setAudit(response.data as InternalAudit);
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

        toast.error("Unable to load the saved audit.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [auditId]);

  const handleRerun = async () => {
    if (!auditId) {
      return;
    }

    setRerunLoading(true);

    try {
      const response = await axiosInstance.post(
        `/tools/audit/${auditId}/rerun`,
      );
      setRerunResult(response.data.data);
      toast.success("Audit rerun completed.");
    } catch (error: unknown) {
      toast.error("Unable to rerun the audit.");
    } finally {
      setRerunLoading(false);
    }
  };

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

  if (!auditId || !audit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center">
            <h1 className="text-4xl font-bold text-white">
              Audit diff not found
            </h1>
            <p className="text-zinc-400 mt-4 leading-relaxed">
              We could not find the requested audit diff. Confirm the link or start a new audit.
            </p>
            <button
              type="button"
              onClick={() => navigate("/audit")}
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-2xl font-semibold text-white transition"
            >
              Start a new audit
            </button>
          </div>
        </Container>
      </div>
    );
  }

  const summary = audit.changeSummary;
  const pricingChanges = summary?.pricingDiff?.changes || [];
  const reportChanged = summary?.reportChanged;
  const recommendationDiff = summary?.recommendationDiff;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <Container>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-violet-300">
                Audit invalidation
              </p>
              <h1 className="text-4xl font-bold text-white">
                Pricing diff for {auditId}
              </h1>
              <p className="mt-3 text-zinc-400 max-w-2xl">
                This audit has been marked as outdated because pricing data or report output changed since it was first generated.
              </p>
            </div>
            <Link
              to={`/public/audits/${auditId}`}
              className="inline-flex items-center justify-center rounded-2xl border border-violet-500 bg-violet-700/10 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-700/20"
            >
              View shared audit
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <p className="text-sm text-zinc-400">Pricing updates</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {pricingChanges.length}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <p className="text-sm text-zinc-400">Recommendation change</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {recommendationDiff?.changed ? "Yes" : "No"}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <p className="text-sm text-zinc-400">Savings delta</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {formatCurrency(summary?.savingsDelta ?? 0)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Previous audit summary</h2>
              <p className="text-sm text-zinc-400">Recommendation</p>
              <p className="mt-2 text-white">
                {summary?.previousReport?.overallRecommendations?.[0] || "No recommendation available."}
              </p>
              <p className="mt-4 text-sm text-zinc-400">Total tools</p>
              <p className="mt-2 text-white">
                {summary?.previousReport?.toolAudits?.length ?? 0}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Updated audit summary</h2>
              <p className="text-sm text-zinc-400">Recommendation</p>
              <p className="mt-2 text-white">
                {summary?.currentReport?.overallRecommendations?.[0] || "No recommendation available."}
              </p>
              <p className="mt-4 text-sm text-zinc-400">Total tools</p>
              <p className="mt-2 text-white">
                {summary?.currentReport?.toolAudits?.length ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Pricing diff details</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Review the headline changes detected in this audit.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRerun}
                disabled={rerunLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {rerunLoading ? "Rerunning..." : "Rerun audit"}
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {pricingChanges.length === 0 && (
                <p className="text-zinc-400">
                  No direct pricing changes were detected. The audit may still be invalid because the recommendation output changed.
                </p>
              )}

              {pricingChanges.map((change, index) => (
                <div
                  key={`${change.toolId}-${index}`}
                  className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-4"
                >
                  <p className="text-sm font-medium text-white">
                    {formatPricingChange(change)}
                  </p>
                  {change.type === "price_changed" && (
                    <p className="mt-2 text-sm text-zinc-400">
                      from {formatCurrency(change.oldPrice ?? 0)} to {formatCurrency(change.newPrice ?? 0)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {rerunResult && (
            <div className="bg-zinc-900 border border-violet-500 rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-white">Rerun result</h2>
              <p className="mt-2 text-zinc-400">
                The audit was run again using the saved input. Compare the new recommendation below.
              </p>
              <div className="mt-4 rounded-3xl bg-zinc-950 p-4">
                <p className="text-sm text-zinc-400">Top recommendation</p>
                <p className="mt-2 text-white">
                  {rerunResult.overallRecommendations?.[0] || "No recommendation returned."}
                </p>
                <p className="mt-4 text-sm text-zinc-400">Tools evaluated</p>
                <p className="mt-2 text-white">
                  {Array.isArray(rerunResult.toolAudits) ? rerunResult.toolAudits.length : 0}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/audit"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Start a fresh audit
            </Link>
            <Link
              to={`/public/audits/${auditId}`}
              className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              View shared audit
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AuditDiff;
