import { getAllAudits, markAuditInvalidated } from "../db/publicAuditStore.js";
import { pricingData } from "../data/pricingData.js";
import { runAudit } from "./audit.engine.js";
import { getTotalPotentialSavings } from "./publicAudit.js";

function getNormalizedPrice(price) {
  if (typeof price === "number") {
    return price;
  }

  return (
    Number(price?.inputPerMTok || 0) +
    Number(price?.outputPerMTok || 0)
  );
}

function buildPricingSnapshot(auditItems) {
  if (!Array.isArray(auditItems)) return {};

  return auditItems.reduce((snapshot, item) => {
    const toolInfo = pricingData[item.toolId];
    if (!toolInfo || snapshot[item.toolId]) return snapshot;

    snapshot[item.toolId] = {
      name: toolInfo.name,
      plans: toolInfo.plans,
    };

    return snapshot;
  }, {});
}

function comparePricingSnapshots(oldSnapshot = {}, currentSnapshot = {}) {
  const changes = [];
  const toolIds = new Set([
    ...Object.keys(oldSnapshot || {}),
    ...Object.keys(currentSnapshot || {}),
  ]);

  for (const toolId of toolIds) {
    const oldTool = oldSnapshot[toolId];
    const newTool = currentSnapshot[toolId];

    if (!oldTool) {
      changes.push({ toolId, type: "tool_added", toolName: newTool?.name || null });
      continue;
    }

    if (!newTool) {
      changes.push({ toolId, type: "tool_removed", toolName: oldTool.name });
      continue;
    }

    const oldPlans = oldTool.plans || [];
    const newPlans = newTool.plans || [];
    const planMap = new Map(newPlans.map((p) => [p.id, p]));

    for (const oldPlan of oldPlans) {
      const newPlan = planMap.get(oldPlan.id);
      if (!newPlan) {
        changes.push({ toolId, toolName: oldTool.name, planId: oldPlan.id, planName: oldPlan.name, type: "plan_removed", oldPrice: oldPlan.price });
        continue;
      }

      const oldPrice = getNormalizedPrice(oldPlan.price);
      const newPrice = getNormalizedPrice(newPlan.price);
      if (oldPrice !== newPrice) {
        changes.push({
          toolId,
          toolName: oldTool.name,
          planId: oldPlan.id,
          planName: oldPlan.name,
          type: "price_changed",
          oldPrice,
          newPrice,
        });
      }
    }

    const oldPlanIds = new Set(oldPlans.map((p) => p.id));
    for (const newPlan of newPlans) {
      if (!oldPlanIds.has(newPlan.id)) {
        changes.push({ toolId, toolName: newTool.name, planId: newPlan.id, planName: newPlan.name, type: "plan_added", newPrice: getNormalizedPrice(newPlan.price) });
      }
    }
  }

  return { hasChanges: changes.length > 0, changes };
}

function summarizeReport(report) {
  return {
    overallRecommendations: report?.overallRecommendations || [],
    toolAudits: report?.toolAudits || [],
  };
}

function extractPrimaryRecommendation(report) {
  return report?.overallRecommendations?.[0] || null;
}

function buildChangeSummary(audit, newReport, pricingDiff) {
  const previousReport = audit.outputResult || {};
  const previousRecommendation = extractPrimaryRecommendation(previousReport);
  const currentRecommendation = extractPrimaryRecommendation(newReport);
  const previousSavings = getTotalPotentialSavings(previousReport);
  const currentSavings = getTotalPotentialSavings(newReport);

  return {
    pricingDiff,
    reportChanged: JSON.stringify(previousReport || {}) !== JSON.stringify(newReport || {}),
    recommendationDiff: {
      old: previousRecommendation,
      new: currentRecommendation,
      changed: previousRecommendation !== currentRecommendation,
    },
    savingsDelta: currentSavings - previousSavings,
    previousSavings,
    currentSavings,
    previousReport: summarizeReport(previousReport),
    currentReport: summarizeReport(newReport),
  };
}

export async function detectPricingChanges() {
  const audits = await getAllAudits();
  const affected = [];
  const errors = [];

  for (const audit of audits) {
    try {
      const inputStack = audit.inputStack || {};
      const auditItems = inputStack.auditItems || [];

      const currentSnapshot = buildPricingSnapshot(auditItems);
      const pricingDiff = comparePricingSnapshots(audit.pricingSnapshot || {}, currentSnapshot);

      let newReport;
      try {
        newReport = await runAudit(inputStack);
      } catch (err) {
        errors.push({ auditId: audit.auditId, message: "Failed to rerun audit", error: err?.message || String(err) });
        continue;
      }

      const reportChanged = JSON.stringify(audit.outputResult || {}) !== JSON.stringify(newReport || {});

      if (pricingDiff.hasChanges || reportChanged) {
        const changeSummary = buildChangeSummary(audit, newReport, pricingDiff);
        const invalidatedAudit = await markAuditInvalidated(audit.auditId, changeSummary);
        affected.push({ auditId: audit.auditId, userEmail: audit.userEmail, changeSummary, invalidatedAudit });
      }
    } catch (err) {
      errors.push({ message: "Unexpected error processing audit", error: err?.message || String(err) });
    }
  }

  return { totalAudits: audits.length, affectedAudits: affected.length, affected, errors };
}
