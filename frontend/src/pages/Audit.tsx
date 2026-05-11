import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { LoaderIcon } from "lucide-react";
import Container from "../components/layout/Container";

interface ToolPlan {
  id: string;
  name: string;
  price: number | { inputPerMTok: number; outputPerMTok: number } | string;
  requiresSeat?: boolean;
  seats?: { min: number; max?: number };
}

interface ToolItem {
  id: string;
  name: string;
  plans: ToolPlan[];
}

interface AddedTool {
  key: string;
  toolName: string;
  planId: string;
  toolId: string;
  planName: string;
  monthlySpend: number;
  membersNum?: number;
  priceLabel: string;
  useCase?: Array<"coding" | "writing" | "data" | "research" | "mixed">;
}

const Audit = () => {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [addedTools, setAddedTools] = useState<AddedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [planUseCase, setPlanUseCase] = useState<
    Array<"coding" | "writing" | "data" | "research" | "mixed">
  >([]);
  const [membersNum, setMembersNum] = useState(2);
  const [tokenUsage, setTokenUsage] = useState(0);

  const STORAGE_KEY = "audit-state";

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.addedTools) setAddedTools(parsed.addedTools);
        if (parsed?.selectedTool) setSelectedTool(parsed.selectedTool);
        if (parsed?.selectedPlan) setSelectedPlan(parsed.selectedPlan);
        if (typeof parsed?.membersNum === "number")
          setMembersNum(parsed.membersNum);
        if (typeof parsed?.tokenUsage === "number")
          setTokenUsage(parsed.tokenUsage);
      } catch {
        console.error("Failed to parse saved audit state. Starting fresh.");
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/tools");
        setTools(res.data);

        if (res.data.length > 0) {
          const firstTool: ToolItem = res.data[0];
          setSelectedTool((current) => current || firstTool.id);
          setSelectedPlan((current) => current || firstTool.plans[0]?.id || "");
        }
      } catch {
        toast.error("Unable to load tools. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const currentTool = tools.find((tool) => tool.id === selectedTool);
    if (
      currentTool &&
      !currentTool.plans.some((plan) => plan.id === selectedPlan)
    ) {
      setSelectedPlan(currentTool.plans[0]?.id || "");
    }

    // Auto adjust membersNum if switching to a plan with seat requirements
    const plans = currentTool?.plans || [];
    const plan = plans.find((p) => p.id === selectedPlan);
    if (plan?.requiresSeat) {
      const minSeats = plan.seats?.min || 2;
      if (membersNum < minSeats) {
        setMembersNum(minSeats);
      }
    }
  }, [selectedTool, selectedPlan, tools, membersNum]);

  useEffect(() => {
    if (!loading) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          addedTools,
          selectedTool,
          selectedPlan,
          membersNum,
          tokenUsage,
        }),
      );
    }
  }, [addedTools, selectedTool, selectedPlan, membersNum, tokenUsage, loading]);

  const currentTool = tools.find((tool) => tool.id === selectedTool);
  const plans = currentTool?.plans || [];
  const planInfo = plans.find((plan) => plan.id === selectedPlan) || null;
  const isTokenPlan = Boolean(
    planInfo &&
    typeof planInfo.price === "object" &&
    "inputPerMTok" in planInfo.price,
  );
  const tokenPrice = isTokenPlan
    ? (planInfo?.price as { inputPerMTok: number; outputPerMTok: number })
    : null;

  const calculateMonthlySpend = () => {
    if (!planInfo) return 0;

    if (typeof planInfo.price === "number") {
      const seatCount = planInfo.requiresSeat
        ? Math.max(membersNum, planInfo.seats?.min || 1)
        : 1;
      return planInfo.price * seatCount;
    }

    if (tokenPrice) {
      return (
        tokenUsage *
        ((tokenPrice.inputPerMTok || 0) + (tokenPrice.outputPerMTok || 0))
      );
    }

    return 0;
  };

  const totalMonthlySpend = addedTools.reduce(
    (total, tool) => total + tool.monthlySpend,
    0,
  );

  const handleAddTool = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!planInfo) {
      toast.error("Please select a valid tool and plan.");
      return;
    }

    if (planInfo.requiresSeat && membersNum < (planInfo.seats?.min || 1)) {
      toast.error(
        `Minimum ${planInfo.seats?.min || 1} people required for this plan.`,
      );
      return;
    }

    if (isTokenPlan && tokenUsage <= 0) {
      toast.error("Enter expected monthly token usage to estimate spend.");
      return;
    }

    if (planUseCase.length === 0) {
      toast.error("Please select at least one use case.");
      return;
    }

    const monthlySpend = calculateMonthlySpend();
    const priceLabel =
      typeof planInfo.price === "number"
        ? `$${planInfo.price}${planInfo.requiresSeat ? "/seat" : ""}`
        : typeof planInfo.price === "string"
          ? planInfo.price
          : tokenPrice
            ? `$${tokenPrice.inputPerMTok}/in + $${tokenPrice.outputPerMTok}/out`
            : "Based on usage";

    const newTool: AddedTool = {
      key: `${selectedTool}-${selectedPlan}-${Date.now()}`,
      toolId: selectedTool,
      planId: selectedPlan,
      toolName: currentTool?.name || "Unknown Tool",
      planName: planInfo.name,
      monthlySpend,
      membersNum: planInfo.requiresSeat ? membersNum : undefined,
      priceLabel,
      useCase: planUseCase,
    };

    setAddedTools((prev) => [...prev, newTool]);
    toast.success(`${newTool.toolName} - ${newTool.planName} added`);
    setTokenUsage(0);
    setPlanUseCase([]);
  };

  const handleRemoveTool = (key: string) => {
    setAddedTools((prev) => prev.filter((tool) => tool.key !== key));
  };

  const buildAuditPayload = () => ({
    auditItems: addedTools.map((tool) => ({
      toolId: tool.toolId,
      planId: tool.planId,
      toolName: tool.toolName,
      planName: tool.planName,
      monthlySpend: tool.monthlySpend,
      membersNum: tool.membersNum,
      priceLabel: tool.priceLabel,
      useCase: tool.useCase || "",
    })),
    totalMonthlySpend,
    totalAnnualSpend: totalMonthlySpend * 12,
  });

  const handleSubmitAudit = async () => {
    if (addedTools.length === 0) {
      toast.error("Add at least one tool before submitting the audit.");
      return null;
    }

    const payload = buildAuditPayload();

    try {
      const response = await axiosInstance.post("/tools/audit", payload);
      toast.success("Audit submitted successfully. Please wait.");
      return response.data;
    } catch (error) {
      toast.error("Unable to submit audit. Please try again later.");
      throw error;
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="animate-spin text-violet-500" size={48} />
      </div>
    );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl font-bold text-white">
              Audit Your AI Stack
            </h1>
            <p className="mt-4 text-zinc-400 text-lg">
              Add your AI tool subscriptions and discover how much you could be
              saving.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Add Your AI Tools
                </h2>

                <form onSubmit={handleAddTool} className="space-y-4 mb-8">
                  <div>
                    <label
                      htmlFor="tool-name"
                      className="block text-sm font-medium text-zinc-300 mb-2"
                    >
                      Tool Name
                    </label>
                    <select
                      id="tool-name"
                      title="tool-name"
                      className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                      value={selectedTool}
                      onChange={(e) => setSelectedTool(e.target.value)}
                    >
                      {tools.map((tool) => (
                        <option key={tool.id} value={tool.id}>
                          {tool.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="plan-name"
                      className="block text-sm font-medium text-zinc-300 mb-2"
                    >
                      Tier/Plan
                    </label>
                    <select
                      id="plan-name"
                      title="plan"
                      className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {planInfo?.requiresSeat && (
                    <div>
                      <label
                        htmlFor="members-num"
                        className="block text-sm font-medium text-zinc-300 mb-2"
                      >
                        Number of people
                      </label>
                      <input
                        id="members-num"
                        type="number"
                        min={planInfo.seats?.min || 1}
                        value={membersNum}
                        placeholder={`Minimum ${planInfo.seats?.min || 2} people`}
                        className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                        onChange={(e) => setMembersNum(Number(e.target.value))}
                      />
                      {membersNum < (planInfo.seats?.min || 2) && (
                        <p className="text-xs text-red-500 mt-1">
                          Minimum {planInfo.seats?.min || 2} people required for
                          this plan.
                        </p>
                      )}
                    </div>
                  )}

                  {tokenPrice && (
                    <>
                      <div>
                        <label
                          htmlFor="token-usage"
                          className="block text-sm font-medium text-zinc-300 mb-2"
                        >
                          Expected monthly usage (million tokens)
                        </label>
                        <input
                          id="token-usage"
                          type="number"
                          min={0}
                          value={tokenUsage}
                          placeholder="e.g. 2"
                          className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                          onChange={(e) =>
                            setTokenUsage(Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="input-token-price"
                            className="block text-sm font-medium text-zinc-300 mb-2"
                          >
                            Input per million token ($)
                          </label>
                          <input
                            id="input-token-price"
                            type="number"
                            title="Input per million token price"
                            value={tokenPrice?.inputPerMTok}
                            readOnly
                            className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 cursor-default"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="output-token-price"
                            className="block text-sm font-medium text-zinc-300 mb-2"
                          >
                            Output per million token ($)
                          </label>
                          <input
                            id="output-token-price"
                            type="number"
                            title="Output per million token price"
                            value={tokenPrice?.outputPerMTok}
                            readOnly
                            className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 cursor-default"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {!isTokenPlan && (
                    <div>
                      <label
                        htmlFor="monthly-spend"
                        className="block text-sm font-medium text-zinc-300 mb-2"
                      >
                        Monthly Spend ($)
                      </label>
                      <input
                        id="monthly-spend"
                        title="Estimated monthly spend"
                        type="number"
                        value={
                          typeof planInfo?.price === "number"
                            ? planInfo.price *
                              (planInfo.requiresSeat
                                ? Math.max(membersNum, planInfo.seats?.min || 1)
                                : 1)
                            : 0
                        }
                        readOnly
                        className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 cursor-default"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-4">
                      Use Cases <span className="text-red-500">*</span> (select at least one)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["coding", "writing", "data", "research", "mixed"].map((useCase) => {
                        const isChecked = planUseCase.includes(useCase as "coding" | "writing" | "data" | "research" | "mixed");
                        return (
                          <label key={useCase} className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border-2 transition-all bg-zinc-950" style={{borderColor: isChecked ? "#a78bfa" : "#3f3f46"}}>
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-lg border-2 flex-shrink-0" style={{backgroundColor: isChecked ? "#7c3aed" : "#09090b", borderColor: isChecked ? "#7c3aed" : "#52525b"}}>
                              {isChecked && (
                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const value = useCase as "coding" | "writing" | "data" | "research" | "mixed";
                                if (e.target.checked) {
                                  setPlanUseCase([...planUseCase, value]);
                                } else {
                                  setPlanUseCase(planUseCase.filter((u) => u !== value));
                                }
                              }}
                              className="hidden"
                            />
                            <span className="text-sm font-medium capitalize flex-1" style={{color: isChecked ? "#c4b5fd" : "#a1a1aa"}}>{useCase}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-2xl font-semibold text-white transition mt-6 cursor-pointer "
                  >
                    Add Tool
                  </button>
                </form>

                {addedTools.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Added Tools
                    </h3>
                    {addedTools.map((tool) => (
                      <div
                        key={tool.key}
                        className="bg-black border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white font-semibold">
                              {tool.toolName}
                            </p>
                            <p className="text-zinc-400 text-sm">
                              {tool.planName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTool(tool.key)}
                            className="text-zinc-500 hover:text-red-500 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
                          <div>Price: {tool.priceLabel}</div>
                          {tool.membersNum ? (
                            <div>Seats: {tool.membersNum}</div>
                          ) : null}
                        </div>
                        {tool.useCase && (
                          <div className="text-sm text-zinc-400">
                            Use case: {tool.useCase.join(", ")}
                          </div>
                        )}
                        <div className="text-white font-semibold">
                          Estimated monthly spend: $
                          {tool.monthlySpend.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Section */}
            <div>
              <div className="bg-linear-to-br from-violet-900/20 to-violet-900/5 border border-violet-500/20 rounded-3xl p-8 sticky top-32">
                <h3 className="text-lg font-semibold text-violet-300 mb-6">
                  Audit Summary
                </h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">
                      Total Monthly Spend
                    </p>
                    <p className="text-3xl font-bold text-white">
                      ${totalMonthlySpend.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      ${(totalMonthlySpend * 12).toFixed(2)}/year
                    </p>
                  </div>

                  <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-sm text-zinc-400 mb-2">Tools Added</p>
                    <p className="text-2xl font-bold text-white">
                      {addedTools.length}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitAudit}
                    disabled={addedTools.length === 0}
                    className={`w-full py-3 rounded-2xl font-semibold transition ${
                      addedTools.length === 0
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                    }`}
                  >
                    Submit Audit
                  </button>

                  <p className="text-xs text-zinc-500 text-center">
                    Add at least one tool to continue
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-2">
                No Billing Access Needed
              </h4>
              <p className="text-sm text-zinc-400">
                Simply enter your subscription details. We never access your
                billing info.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-2">
                Instant Analysis
              </h4>
              <p className="text-sm text-zinc-400">
                Get personalized recommendations in seconds based on your stack.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-2">
                Shareable Reports
              </h4>
              <p className="text-sm text-zinc-400">
                Generate beautiful reports to share with your team and
                stakeholders.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Audit;
