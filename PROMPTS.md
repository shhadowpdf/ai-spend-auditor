# Prompts

This document covers every LLM prompt used inside the Credex product, why each
constraint was written the way it was, and what earlier versions looked like that
didn't work.

---

## 1. Audit Summary Prompt

**File:** `backend/src/utils/groq.js`  
**Triggered by:** `POST /api/tools/audit` — runs once per audit, after `runAudit()` returns  
**Model:** `openai/gpt-oss-20b` via Groq Cloud (OpenAI-compatible endpoint)

### The Prompt

```
You are an AI SaaS cost optimization assistant.

Given a JSON audit report, generate ONE concise personalized summary paragraph (~100 words).

Requirements:
- Write in a professional but conversational tone.
- Focus on the biggest savings opportunity first.
- Mention total monthly and annual spend.
- Mention the number of tools analyzed.
- Highlight whether the user is overspending or already optimized.
- Quantify potential savings clearly.
- Reference the user's actual use cases when relevant.
- Avoid bullet points, headings, hype, or generic advice.
- Do not repeat raw JSON fields mechanically.
- Keep the output between 80–120 words.
- End with one actionable recommendation sentence.

Input JSON:
{${AUDIT_JSON}}
```

---

### Why It Was Written This Way

**`You are an AI SaaS cost optimization assistant.`**  
A short role assignment at the top. Without it, the model tends to respond as a generic assistant and writes summaries that hedge everything ("it depends on your needs…"). The role anchors the register and keeps the output opinionated.

**`generate ONE concise personalized summary paragraph`**  
The word "ONE" is doing real work. Early versions without it would produce multiple paragraphs — an intro, a body, and a closing sentence — which looked verbose and out of place on the results page where the summary sits next to a detailed breakdown. "Personalized" is there to stop the model from writing something that could have been generated without even reading the JSON (generic cost advice).

**`Focus on the biggest savings opportunity first.`**  
Without this, the model would summarize tools in the order they appeared in the JSON array, which is arbitrary. Users scan the first sentence. If the biggest win is buried at the end, the summary is useless as a hook.

**`Mention total monthly and annual spend. Mention the number of tools analyzed.`**  
These ground the summary in the user's actual situation. Without them, the output reads like a generic tip article. With them, it reads like something that knows your stack.

**`Avoid bullet points, headings, hype, or generic advice.`**  
The results page already has a structured breakdown with tables and cards. A bulleted LLM summary on top of that is redundant and visually noisy. "Hype" and "generic advice" are explicit because models default to things like "optimizing your AI spend is critical in today's competitive landscape" if you don't rule it out.

**`Do not repeat raw JSON fields mechanically.`**  
Early versions would output things like `"toolId": "cursor", monthlyCost: 60` verbatim from the JSON. This constraint forces the model to paraphrase — "you're spending $60/month on Cursor" instead of dumping field names at the reader.

**`Keep the output between 80–120 words.`**  
A hard word range is more reliable than "concise." The results page has a fixed-height card for the summary. Below 80 words it looks empty; above 120 it overflows or requires a scroll. The range forces enough specificity without padding.

**`End with one actionable recommendation sentence.`**  
The last sentence is the one users remember. Without this constraint, the model often ends with a hedge ("results may vary") or a restatement of the intro. Forcing an action sentence means the summary closes with something the user can actually do.

---

### What Didn't Work

**Version 1 — No constraints, just the role and the JSON**

```
You are an AI SaaS cost optimization assistant. 
Summarize this audit report: {AUDIT_JSON}
```

Output was unpredictable in length (anywhere from 40 to 500 words) and structure (sometimes bullet points, sometimes multiple paragraphs, sometimes a table). The tone swung between casual and clinical depending on what was in the JSON. Unusable for a UI where the output has a fixed slot.

**Version 2 — Word limit only**

Added `Keep it under 100 words.` The length became consistent but the content didn't. The model would spend the entire 100 words describing the JSON structure rather than giving the user a useful takeaway. A summary like "The report covers 4 tools with a combined monthly spend of $340 and identifies alternatives for 3 of them" is technically accurate and completely useless.

**Version 3 — Added tone and structure constraints, but no "one paragraph" instruction**

The model started producing two paragraphs: a financial summary and a "recommendation" section. This looked reasonable in isolation but clashed with the results page layout, which already has a dedicated "recommendations" section from the audit engine. The LLM was duplicating the deterministic output in prose form, which confused users about which source to trust.

**Version 4 — Added "ONE paragraph" and "avoid bullet points"**

This is essentially what landed in production. The remaining issue was that the model would still occasionally output a sentence like "Based on the JSON provided, your monthly spend is…" — acknowledging the prompt format rather than speaking directly to the user. Adding `Do not repeat raw JSON fields mechanically` fixed this by forcing the model to internalize the data rather than cite it.

---

### Notes on Failure Handling

The Groq call is wrapped in a `try/catch` in `tool.controller.js`. If it fails (rate limit, model error, timeout), `LLMResponse` is set to an empty string and the audit result is returned without a summary. The frontend renders the summary block conditionally — users still get the full structured report, just without the prose paragraph. This was a deliberate choice: the deterministic audit engine is the product; the LLM summary is a polish layer.
