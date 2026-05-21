import { pricingData } from "../data/pricingData.js";

function isApiTool(toolInfo) {
  return toolInfo.name.includes("API");
}

function matchesUseCases(plan, useCases = []) {
  return useCases.every((useCase) =>
    plan.bestCase.includes(useCase)
  );
}

function calculateSubscriptionCost(plan, membersNum = 1) {
  if (typeof plan.price !== "number") {
    return Infinity;
  }

  let seats = membersNum;

  if (plan.requiresSeat && plan.seats?.min) {
    seats = Math.max(membersNum, plan.seats.min);
  }

  return plan.price * seats;
}

function getCurrentToolMonthlySpend(tool, toolInfo) {
  const currentPlan = toolInfo.plans?.find(
    (plan) => plan.id === tool.planId,
  );

  if (!currentPlan) {
    return tool.monthlySpend || 0;
  }

  if (typeof currentPlan.price === "number") {
    return calculateSubscriptionCost(
      currentPlan,
      tool.membersNum || 1,
    );
  }

  return tool.monthlySpend || 0;
}

function createSubscriptionAlternative(toolInfo, plan, monthlyCost) {
  return {
    toolName: toolInfo.name,
    planName: plan.name,
    monthlyCost,
    requiresSeat: plan.requiresSeat || false,
    priceLabel:
      typeof plan.price === "number"
        ? `$${plan.price}`
        : plan.price,
  };
}

function findAlternativesWithin(
  toolInfo,
  currentPlanName,
  membersNum,
  monthlySpend,
  useCases
) {
  const alternatives = [];

  for (const plan of toolInfo.plans) {
    if (plan.id === currentPlanName) {
      continue;
    }

    if (!matchesUseCases(plan, useCases)) {
      continue;
    }

    const cost = calculateSubscriptionCost(
      plan,
      membersNum
    );

    if (cost <= monthlySpend) {
      alternatives.push(
        createSubscriptionAlternative(
          toolInfo,
          plan,
          cost
        )
      );
    }
  }

  return alternatives.sort(
    (a, b) => a.monthlyCost - b.monthlyCost
  );
}

function findAlternativesOutside(
  currentToolId,
  membersNum,
  monthlySpend,
  useCases
) {
  const alternatives = [];

  for (const [toolId, toolInfo] of Object.entries(
    pricingData
  )) {
    if (toolId === currentToolId) {
      continue;
    }

    if (isApiTool(toolInfo)) {
      continue;
    }

    for (const plan of toolInfo.plans) {
      if (!matchesUseCases(plan, useCases)) {
        continue;
      }

      const cost = calculateSubscriptionCost(
        plan,
        membersNum
      );

      if (cost <= monthlySpend) {
        alternatives.push(
          createSubscriptionAlternative(
            toolInfo,
            plan,
            cost
          )
        );
      }
    }
  }

  return alternatives.sort(
    (a, b) => a.monthlyCost - b.monthlyCost
  );
}

function findApiAlternatives(
  currentToolInfo,
  currentPlanName,
  monthlySpend,
  useCases
) {
  const currentPlan = currentToolInfo.plans.find(
    (plan) => plan.id === currentPlanName
  );

  if (
    !currentPlan ||
    typeof currentPlan.price !== "object"
  ) {
    console.log(
      `Cannot estimate usage: current plan ${currentPlanName} missing per-token pricing.`
    );

    return [];
  }

  const {
    inputPerMTok,
    outputPerMTok,
  } = currentPlan.price;

  const totalRate =
    inputPerMTok + outputPerMTok;

  if (totalRate === 0) {
    return [];
  }

  const estimatedTokenUsage =
    monthlySpend / totalRate;

  const alternatives = [];

  for (const toolInfo of Object.values(pricingData)) {
    if (!isApiTool(toolInfo)) {
      continue;
    }

    for (const plan of toolInfo.plans) {
      if (!matchesUseCases(plan, useCases)) {
        continue;
      }

      if (typeof plan.price !== "object") {
        continue;
      }

      const {
        inputPerMTok: inputRate,
        outputPerMTok: outputRate,
      } = plan.price;

      const estimatedMonthlyCost =
        estimatedTokenUsage *
        (inputRate + outputRate);

      if (
        estimatedMonthlyCost <=
        monthlySpend + 0.01
      ) {
        alternatives.push({
          toolName: toolInfo.name,
          planName: plan.name,
          estimatedMonthlyCost,
          savings:
            monthlySpend -
            estimatedMonthlyCost,
          priceLabel: `$${inputRate}/in MTok + $${outputRate}/out MTok`,
        });
      }
    }
  }

  return alternatives.sort(
    (a, b) =>
      a.estimatedMonthlyCost -
      b.estimatedMonthlyCost
  );
}

export async function runAudit(userData) {
  const {
    auditItems,
    totalMonthlySpend,
    totalAnnualSpend,
  } = userData;

  const report = {
    summary: {
      totalMonthlySpend,
      totalAnnualSpend,
      numberOfTools: auditItems.length,
    },

    toolAudits: [],

    overallRecommendations: [],
  };

  for (const tool of auditItems) {
    const toolInfo = pricingData[tool.toolId];

    if (!toolInfo) {
      report.toolAudits.push({
        toolName: tool.toolName,
        error: `Tool "${tool.toolName}" not found in pricing data.`,
      });

      continue;
    }

    const membersNum = tool.membersNum || 1;
    const useCases = tool.useCase || [];
    const monthlySpend = getCurrentToolMonthlySpend(
      tool,
      toolInfo,
    );

    let alternatives = [];
    let alternativeType = "";

    if (isApiTool(toolInfo)) {
      alternativeType = "api";

      alternatives = findApiAlternatives(
        toolInfo,
        tool.planId,
        monthlySpend,
        useCases
      );
    } else {
      alternativeType = "subscription";

      const withinAlternatives =
        findAlternativesWithin(
          toolInfo,
          tool.planId,
          membersNum,
          monthlySpend,
          useCases
        );

      const outsideAlternatives =
        findAlternativesOutside(
          tool.toolId,
          membersNum,
          monthlySpend,
          useCases
        );

      alternatives = [
        ...withinAlternatives,
        ...outsideAlternatives,
      ].sort(
        (a, b) => a.monthlyCost - b.monthlyCost
      );
    }

    const toolAudit = {
      toolName: tool.toolName,
      currentPlan: tool.planName,
      currentMonthlySpend: monthlySpend,
      useCases,
      alternativeType,
      hasCheaperAlternative:
        alternatives.length > 0,
      bestAlternative:
        alternatives[0] || null,
      alternatives: alternatives.slice(0, 5),
    };

    report.toolAudits.push(toolAudit);
  }

  const toolsWithSavings =
    report.toolAudits.filter(
      (toolAudit) =>
        toolAudit.hasCheaperAlternative &&
        toolAudit.bestAlternative
    );

  if (toolsWithSavings.length > 0) {
    report.overallRecommendations.push(
      `You could save money by switching: ${toolsWithSavings
        .map(
          (toolAudit) =>
            `${toolAudit.toolName} → ${toolAudit.bestAlternative.toolName} ${toolAudit.bestAlternative.planName}`
        )
        .join(", ")}.`
    );
  } else {
    report.overallRecommendations.push(
      "No cheaper or equally priced alternative found that matches your use cases."
    );
  }

  return report;
}