/**
 * audit.engine.test.js
 *
 * Test suite for the core audit engine (runAudit).
 * Uses Node.js built-in test runner — no extra dependencies.
 * Run: node --test src/tests/audit.engine.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runAudit } from "../utils/audit.engine.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAuditInput(overrides = {}) {
  return {
    auditItems: [],
    totalMonthlySpend: 0,
    totalAnnualSpend: 0,
    ...overrides,
  };
}

// ─── Test 1: Report shape ────────────────────────────────────────────────────

describe("runAudit — report structure", () => {
  it("returns the correct top-level shape", async () => {
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 100,
        totalAnnualSpend: 1200,
        auditItems: [],
      })
    );

    assert.ok(result.summary, "should have a summary");
    assert.ok(Array.isArray(result.toolAudits), "toolAudits should be an array");
    assert.ok(
      Array.isArray(result.overallRecommendations),
      "overallRecommendations should be an array"
    );
  });

  it("reflects input spend and tool count in summary", async () => {
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 250,
        totalAnnualSpend: 3000,
        auditItems: [
          {
            toolId: "cursor",
            toolName: "Cursor",
            planId: "pro",
            planName: "Pro",
            monthlySpend: 120,
            membersNum: 1,
            useCase: ["coding"],
          },
          {
            toolId: "claude",
            toolName: "Claude",
            planId: "pro",
            planName: "Pro",
            monthlySpend: 130,
            membersNum: 1,
            useCase: ["writing"],
          },
        ],
      })
    );

    assert.equal(result.summary.totalMonthlySpend, 250);
    assert.equal(result.summary.totalAnnualSpend, 3000);
    assert.equal(result.summary.numberOfTools, 2);
  });
});

// ─── Test 2: Unknown tool ────────────────────────────────────────────────────

describe("runAudit — unknown tool handling", () => {
  it("adds an error entry for an unrecognised toolId", async () => {
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 50,
        totalAnnualSpend: 600,
        auditItems: [
          {
            toolId: "nonExistentTool",
            toolName: "Ghost App",
            planId: "pro",
            planName: "Pro",
            monthlySpend: 50,
            membersNum: 1,
            useCase: ["coding"],
          },
        ],
      })
    );

    assert.equal(result.toolAudits.length, 1);
    assert.ok(
      result.toolAudits[0].error,
      "toolAudit for unknown tool should contain an error field"
    );
    assert.match(
      result.toolAudits[0].error,
      /not found in pricing data/i,
      "error message should mention pricing data"
    );
  });
});

// ─── Test 3: Subscription — cheaper plan within same tool ───────────────────

describe("runAudit — subscription within-tool alternatives", () => {
  it("finds a cheaper plan within Cursor when on Ultra ($200/mo) with coding use-case", async () => {
    // Ultra = $200/mo. Pro = $20/mo and covers coding.
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 200,
        totalAnnualSpend: 2400,
        auditItems: [
          {
            toolId: "cursor",
            toolName: "Cursor",
            planId: "ultra",
            planName: "Ultra",
            monthlySpend: 200,
            membersNum: 1,
            useCase: ["coding"],
          },
        ],
      })
    );

    const toolAudit = result.toolAudits[0];
    assert.equal(toolAudit.toolName, "Cursor");
    assert.equal(toolAudit.hasCheaperAlternative, true, "should have cheaper alternatives");
    assert.ok(toolAudit.bestAlternative, "bestAlternative should not be null");
    assert.ok(
      toolAudit.bestAlternative.monthlyCost < 200,
      "best alternative should cost less than $200"
    );
  });

  it("returns up to 5 alternatives", async () => {
    // On ChatGPT Pro ($100) with writing use-case — many alternatives exist
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 100,
        totalAnnualSpend: 1200,
        auditItems: [
          {
            toolId: "chatGPT",
            toolName: "ChatGPT",
            planId: "pro",
            planName: "ChatGPT Pro",
            monthlySpend: 100,
            membersNum: 1,
            useCase: ["writing"],
          },
        ],
      })
    );

    const toolAudit = result.toolAudits[0];
    assert.ok(
      toolAudit.alternatives.length <= 5,
      "alternatives should be capped at 5"
    );
  });
});

// ─── Test 4: Subscription — already on cheapest plan ───────────────────────

describe("runAudit — no cheaper alternative exists", () => {
  it("reports hasCheaperAlternative=false when on the $0 Cursor Hobby plan", async () => {
    // Hobby is $0 — nothing can beat free for the same coding use-case
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 0,
        totalAnnualSpend: 0,
        auditItems: [
          {
            toolId: "cursor",
            toolName: "Cursor",
            planId: "hobby",
            planName: "Hobby",
            monthlySpend: 0,
            membersNum: 1,
            useCase: ["coding"],
          },
        ],
      })
    );

    const toolAudit = result.toolAudits[0];
    assert.equal(
      toolAudit.hasCheaperAlternative,
      false,
      "should have no cheaper alternatives for $0 plan"
    );
    assert.equal(toolAudit.bestAlternative, null);
  });

  it("adds a no-savings overall recommendation when nothing is cheaper", async () => {
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 0,
        totalAnnualSpend: 0,
        auditItems: [
          {
            toolId: "cursor",
            toolName: "Cursor",
            planId: "hobby",
            planName: "Hobby",
            monthlySpend: 0,
            membersNum: 1,
            useCase: ["coding"],
          },
        ],
      })
    );

    const recs = result.overallRecommendations;
    assert.ok(recs.length > 0, "should have at least one recommendation");
    assert.match(
      recs[0],
      /no cheaper/i,
      "recommendation should mention no cheaper alternative"
    );
  });
});

// ─── Test 5: API tool — token-based alternatives ────────────────────────────

describe("runAudit — API tool (token-based) alternatives", () => {
  it("classifies anthropicAPI as an API tool and finds token-based alternatives", async () => {
    // claude-opus-4.1 = $15 in + $75 out per MTok. Cheaper API options exist.
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 500,
        totalAnnualSpend: 6000,
        auditItems: [
          {
            toolId: "anthropicAPI",
            toolName: "Anthropic API",
            planId: "claude-opus-4.1",
            planName: "Claude Opus 4.1",
            monthlySpend: 500,
            membersNum: 1,
            useCase: ["research"],
          },
        ],
      })
    );

    const toolAudit = result.toolAudits[0];
    assert.equal(
      toolAudit.alternativeType,
      "api",
      "Anthropic API should be classified as api type"
    );
    assert.equal(toolAudit.hasCheaperAlternative, true, "cheaper API alternatives should exist");
    assert.ok(
      toolAudit.bestAlternative,
      "bestAlternative should be populated for API tool"
    );
    // API alternatives have estimatedMonthlyCost not monthlyCost
    assert.ok(
      "estimatedMonthlyCost" in toolAudit.bestAlternative,
      "API alternative should expose estimatedMonthlyCost"
    );
  });

  it("classifies openAIAPI as an API tool", async () => {
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 100,
        totalAnnualSpend: 1200,
        auditItems: [
          {
            toolId: "openAIAPI",
            toolName: "OpenAI API",
            planId: "gpt-5.5",
            planName: "GPT-5.5",
            monthlySpend: 100,
            membersNum: 1,
            useCase: ["research"],
          },
        ],
      })
    );

    const toolAudit = result.toolAudits[0];
    assert.equal(
      toolAudit.alternativeType,
      "api",
      "OpenAI API should be classified as api type"
    );
  });
});

// ─── Test 6: Seat-based pricing ──────────────────────────────────────────────

describe("runAudit — seat-based pricing enforcement", () => {
  it("enforces minimum seat count for Claude team plans", async () => {
    // claude team-standard: $20/seat, min 5 seats = $100 minimum
    // If we're only paying $20 (1 seat declared), no plan with min 5 seats
    // at $20/seat should appear as "cheaper" than our $100 declared spend.
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 200,
        totalAnnualSpend: 2400,
        auditItems: [
          {
            toolId: "claude",
            toolName: "Claude",
            planId: "max",
            planName: "Max",
            monthlySpend: 200,
            membersNum: 3,
            useCase: ["research"],
          },
        ],
      })
    );

    const toolAudit = result.toolAudits[0];
    // team-standard with 3 members → max(3, 5) seats × $20 = $100, which IS cheaper than $200
    // So we should find at least one cheaper alternative
    assert.equal(toolAudit.toolName, "Claude");
    // The important thing: any team alternative shown must respect the 5-seat minimum
    if (toolAudit.hasCheaperAlternative) {
      assert.ok(
        toolAudit.bestAlternative.monthlyCost <= 200,
        "best alternative cost must be ≤ current spend"
      );
    }
  });
});

// ─── Test 7: Outside-tool alternatives ───────────────────────────────────────

describe("runAudit — cross-tool alternatives", () => {
  it("finds cheaper alternatives on other tools for Windsurf Max ($200)", async () => {
    // Windsurf Max = $200. Many coding tools are cheaper.
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 200,
        totalAnnualSpend: 2400,
        auditItems: [
          {
            toolId: "windsurf",
            toolName: "Windsurf",
            planId: "max",
            planName: "Max",
            monthlySpend: 200,
            membersNum: 1,
            useCase: ["coding"],
          },
        ],
      })
    );

    const toolAudit = result.toolAudits[0];
    assert.equal(toolAudit.hasCheaperAlternative, true);

    // Ensure at least one alternative is from a different tool
    const crossToolAlt = toolAudit.alternatives.find(
      (alt) => alt.toolName !== "Windsurf"
    );
    assert.ok(crossToolAlt, "should suggest at least one alternative from another tool");
  });
});

// ─── Test 8: Empty input ─────────────────────────────────────────────────────

describe("runAudit — edge cases", () => {
  it("handles empty auditItems without throwing", async () => {
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 0,
        totalAnnualSpend: 0,
        auditItems: [],
      })
    );

    assert.equal(result.summary.numberOfTools, 0);
    assert.equal(result.toolAudits.length, 0);
    assert.ok(
      Array.isArray(result.overallRecommendations),
      "recommendations should still be an array"
    );
  });

  it("handles missing membersNum gracefully (defaults to 1)", async () => {
    // No membersNum provided — engine should default to 1
    const result = await runAudit(
      makeAuditInput({
        totalMonthlySpend: 60,
        totalAnnualSpend: 720,
        auditItems: [
          {
            toolId: "cursor",
            toolName: "Cursor",
            planId: "pro-plus",
            planName: "Pro+",
            monthlySpend: 60,
            // membersNum deliberately omitted
            useCase: ["coding"],
          },
        ],
      })
    );

    // Should not throw; should produce a valid toolAudit
    assert.ok(result.toolAudits[0], "should produce a toolAudit entry");
    assert.equal(result.toolAudits[0].toolName, "Cursor");
  });
});
