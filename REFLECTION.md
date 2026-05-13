# Reflection — Week 1

---

## 1. The Hardest Bug

The hardest bug came on Day 5 when I implemented the audit engine. The function `findAlternativesOutside` was returning alternatives from API tools (like Anthropic API and OpenAI API) in subscription comparisons — meaning a user on a $60 Cursor plan was being shown token-priced API endpoints as cheaper "alternatives," which made no semantic sense. A developer paying for an IDE isn't going to swap it for a raw API access tier.

My first hypothesis was that the filtering logic inside `findAlternativesOutside` was broken — I thought `isApiTool` wasn't being called. I added a `console.log` inside the loop and confirmed it was being called. So the bug wasn't a missing check; it was that the check didn't exist at all. The original `findAlternativesOutside` had no guard for API tools — I had written `isApiTool` as a utility but never applied it in the outside-search path.

The fix was adding a single `if (isApiTool(toolInfo)) continue;` inside the loop — three words. What made it frustrating was that the output *looked* plausible: the API alternatives did technically have lower costs, they just weren't comparable products. This is the category of bug where correctness can't be verified by eyeballing numbers — you have to think about the domain model. The lesson: separation of tool types isn't just a UX concern, it has to be enforced at every comparison boundary in the engine.

---

## 2. A Decision I Reversed

My original plan for the `pricingData.js` catalogue used a field called `audit: {}` as a nested object to hold use-case metadata for each plan. I had already populated it for every tool by Day 4. On Day 5, while wiring it to the audit engine, I realised the structure was wrong for how comparisons actually work. The engine needs to check whether *all* of a user's selected use-cases appear in a plan's capability list — but a nested `audit` object with arbitrary sub-keys couldn't be iterated cleanly with `.every()`.

I reversed the decision and replaced `audit: {}` with a flat `bestCase: []` array on each plan. This meant rewriting every entry in `pricingData.js` — about 60 plan objects. Rather than doing it by hand, I used a scripted bulk replacement approach (learned this the hard way on the first pass when I missed three entries manually). The reversal cost about an hour of Day 5 but made the engine code genuinely clean: `useCases.every(uc => plan.bestCase.includes(uc))` reads like plain English. The original approach would have required either a clunky adapter or a leaky abstraction in the engine itself.

---

## 3. What I Would Build in Week 2

The single most valuable thing I didn't get to is a **comparison mode** — letting a user input their current stack and then a hypothetical future stack side by side, and seeing a diff of monthly savings before committing. Right now the tool tells you *that* you could save money; it doesn't let you *simulate* a switch.

Beyond that, I would build:

- **Admin dashboard** — a simple password-protected page showing how many audits have been run, total identified savings across all users, and a list of the most commonly flagged overspend tools. This turns the app from a one-shot tool into something with feedback loops for the business.
- **Pricing data refresh pipeline** — the current JSON catalogue is static and hand-maintained. I would write a lightweight scraper or at minimum a schema-validated YAML file with a CI check that blocks PRs if a plan's price looks anomalous (e.g. a price that dropped to zero because a field was accidentally deleted).
- **Shareable comparison cards** — an OG image generator that produces a visual "You're spending $X, you could spend $Y" card formatted for Twitter/LinkedIn, making the sharing mechanic actually viral rather than just a link to a read-only audit page.

---

## 4. How I Used AI Tools

I worked with three AI tools across the week: **GitHub Copilot**, **ChatGPT**, and **Claude**.

**GitHub Copilot** was open the entire time inside VS Code and handled the low-level mechanical work — completing repetitive patterns in `pricingData.js` (each plan object follows the same shape), auto-filling Express route boilerplate, and suggesting JSDoc-style comments. It's best treated as a fast autocomplete, not a thinker; I accepted its suggestions when they were structurally obvious and ignored them the moment business logic was involved.

**ChatGPT** I used for research and talking through design decisions before writing any code — things like "what's the right shape for a public audit payload that's safe to expose without leaking emails?" and sanity-checking whether the seat-pricing formula I had in mind was correct. It's good for back-and-forth reasoning but I never pasted its code directly.

**Claude**  handled the heavier generation tasks: the Resend email HTML templates, the rate limiter middleware once I'd spec'd it out, the test suite. I also used it to review `audit.engine.js` after writing it myself — walking through the comparison logic, seat-minimum enforcement, and the API vs subscription branching to check for edge cases I might have missed. For code generation, I only accepted output where the logic had no product-correctness risk; for the engine, it was a reviewer, not the author.

**What I didn't trust any of them with:**
- Writing the audit engine's core comparison logic (`audit.engine.js`) — I wrote this myself and used Claude only as a reviewer afterward. The rules around API vs subscription tools, minimum seat enforcement, and use-case matching are subtle enough that a plausible-looking but wrong implementation would silently produce bad recommendations, the worst kind of failure for a product built on trust.
- Pricing figures in `pricingData.js`. I verified every number against the actual vendor pricing pages. All three tools would have hallucinated or cited stale prices if asked.

**One specific time the AI was wrong and I caught it:**
When I asked Claude for the rate limiter, the first version stored the window reset timestamp correctly but then compared it with `<` instead of `>` when checking whether the window had expired. The logic was inverted — it would reset the counter on every request while the reset time was still in the future, which is always. The limiter would have never blocked anyone. I caught it by tracing through the math with a two-request example on paper before putting it in the codebase.

---

## 5. Self-Rating

| Dimension | Score | Reason |
|---|---|---|
| **Discipline** | 7/10 | Logged every day and hit the 3-5 hr target consistently, but Day 4 was short (1.5 hrs) and I could have pushed through the backend placeholder issue rather than deferring it |
| **Code quality** | 8/10 | The audit engine is clean and pure with no I/O coupling, the storage layer has a proper fallback strategy, and error handling is non-fatal throughout — but there are no unit tests for the email builder or the public audit renderer |
| **Design sense** | 7/10 | The landing page and results UI are polished and intentional; the audit form works but the UX of adding multiple tools sequentially feels clunky and I know it |
| **Problem-solving** | 8/10 | Found and fixed the API-tool-in-subscription-comparison bug before it shipped, reversed the data structure decision before it calcified — both required stepping back rather than patching forward |
| **Entrepreneurial thinking** | 7/10 | The lead capture flow, high-savings threshold detection, and shareable public audit link are genuinely product-minded features, not just engineering exercises — but I haven't thought enough about distribution or how someone actually discovers this tool |
