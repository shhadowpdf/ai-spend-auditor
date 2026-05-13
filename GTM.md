# GTM — Go-To-Market

---

## The Exact Target User

**Title:** CTO or Head of Engineering at a seed-to-Series-A startup, 8–35 people, technical founder still in the code.

**Why this specific person:** They are the one who set up the Cursor Business seats, added GitHub Copilot to the org, approved the OpenAI API key, and forwarded the Anthropic invoice to finance without reading it. They are also the one who gets a Slack message from their co-founder or CFO every quarter that says something like "our AWS + AI bill is $4k this month, can you look at this?" They don't have a procurement team. They don't have a FinOps function. They have a spreadsheet and a vague feeling that something is redundant.

They are not an enterprise buyer. They are a builder who accidentally became a budget owner.

---

## What They're Searching and Scrolling Right Before They'd Want This

- They just opened their Stripe or billing dashboard and saw the monthly AI line items for the first time as a combined number
- They're reading a thread on X titled something like "our OpenAI bill hit $2k this month and I'm not sure why"
- They Googled: `"cursor vs github copilot price"`, `"is claude pro worth it for dev team"`, `"reduce openai api costs startup"`
- They're in the middle of a YC/investors expense review and realized they have 4 overlapping AI writing/coding tools
- They're onboarding a new hire and realize they need to add another seat to three different tools simultaneously

---

## Where They Actually Hang Out

| Channel | Why it's relevant |
|---|---|
| **r/ExperiencedDevs** | Senior devs openly discuss tooling choices and ROI; threads about AI tool costs appear weekly |
| **r/SaaS** | Founders comparing costs is a constant topic; tool ROI posts get hundreds of upvotes |
| **r/cscareerquestions** | Junior/mid devs asking "is Cursor worth it" — adjacent audience who escalates to their CTO |
| **Hacker News** | The primary watering hole for technical founders; Show HN and Ask HN threads on AI tool cost surface naturally |
| **Lenny's Slack** (~40k members) | Product and growth leaders who also hold tool budgets at their startups |
| **AI Engineer Discord** (Swyx's community) | 10k+ AI builders actively debating model cost vs capability tradeoffs |
| **Cursor's official Discord** | People comparing plans, asking if Pro is worth it vs Hobby — exact moment of intent |
| **X / formerly Twitter** | Searching `"cursor expensive"`, `"copilot worth it"`, `"openai bill"` surfaces real-time complaints to reply to |

---

## First 100 Users in 30 Days, $0 Budget

**Week 1: Seed with intent traffic, not reach**

1. **Run the tool on your own stack and publish the audit link publicly.** Write a 400-word post on X or HN with the real numbers: "I was spending $X/month across 5 AI tools. Here's what the audit found." Attach the shareable audit link. Don't sell it — show the output. This is the most credible ad that exists.

2. **Search X for `"openai bill"`, `"cursor pro"`, `"copilot vs cursor"`, `"ai tools expensive"` — every day.** Find people mid-frustration and reply: "I built something for this exact problem, here's a link to your free audit." Target: 10 direct replies per day, no mass DM tools.

3. **Post in r/ExperiencedDevs and r/SaaS** with a "Show HN"-style post. Title: *"I built a free tool that audits your AI tool stack and finds cheaper alternatives — here's what it found for mine."* Include the actual audit output image. Don't bury the lede with features.

**Week 2: Convert communities with existing frustration**

4. **Drop into Cursor's Discord** in the #general or #billing channels. When anyone asks "is Pro worth it for a team of X?" — answer the question helpfully, then add: "I built a calculator that accounts for seat minimums and use-case fit if that's useful." No spam, one reply per thread.

5. **Email 20 YC S23/W24 CTOs directly.** The YC portfolio list is public. Filter for dev-tool, AI, or B2B SaaS companies at seed stage. Write a 4-sentence cold email: what it does, what it found for a comparable stack, the link, no ask. Target: 5% reply rate = 1 live user per email batch.

6. **Post a Show HN** on a weekday morning. HN Show HN front-page = 200–800 visitors in 24 hours for a well-positioned post. Title: *"Show HN: I built a free AI tool spend auditor — enter your stack, get cheaper alternatives."* Have 3 specific audit examples ready to paste in comments.

**Week 3–4: Earned distribution**

7. **Find the 2–3 users from Week 1 who shared their audit link on their own.** DM them. Ask if they'd write one sentence about it. These are your first testimonials and your first referral loop.

8. **Reach out to The Pragmatic Engineer, Lenny's Newsletter, TLDR Tech** with a one-paragraph blurb. Not a PR pitch — an interesting finding: "Across the first N audits, 70% of teams are paying for at least two overlapping coding assistants." Data-led, not product-led.

---

## The Unfair Distribution Channel

**The shareable public audit link is the distribution.**

Every audit Credex runs produces a public URL — a branded, read-only page with an OG image, canonical URL, and savings summary. When a CTO shares their audit with their co-founder, their team, or posts it on Twitter to say "look what I found," Credex is embedded in the share. The link *is* the referral.

No other tool in this space generates a shareable artifact by default. Comparable tools (CloudZero, Apptio, Zylo) are enterprise-gated, require a demo call, and never produce anything shareable. Credex produces a public link in 30 seconds.

This means every high-savings audit — the ones where someone is visibly overspending — is also the most likely to be screenshot, shared, or sent to a Slack channel. The higher the savings number on the audit, the more embarrassing and therefore interesting it is to share. The product is its own distribution engine.

---

## What Week-1 Traction Looks Like If This Works

If the Show HN post + direct reply strategy and the Discord drops land:

- **200–400 unique visitors** in the first 7 days
- **60–90 audits submitted** (15–25% conversion from visitor to audit; the form is low-friction, no signup required)
- **12–20 email captures** from users who opted into the audit confirmation email
- **4–8 public audit links shared** organically (screenshot on X, linked in a Slack, forwarded to a team)
- **1–2 inbound lead captures** (users who clicked "I want help" or "Notify me" — the high-intent CTA on the results page)
- **1 HN comment thread** with 10+ replies where someone says "this is surprisingly accurate for my stack"

If none of that happens in week 1, the problem is not the channel — it's the copy on the landing page or the audit output isn't credible enough. That's fixable. A zero-engagement week is signal, not failure.
