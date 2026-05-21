I followed the ground rules for Round 2: I did not start fresh, I stayed in the existing Round 1 codebase, and I kept the process honest about AI assistance and code state. I used ChatGPT and GitHub Copilot to help research, refine wording, and identify the best fix paths, and I specifically used GitHub Copilot to help draft and polish the documentation.

1. What was the most uncomfortable trade-off you made because of the time pressure?
I chose not to build a full admin pricing editor or database-backed catalogue, even though that would make pricing updates more maintainable. The faster and more reliable choice for this round was to keep the pricing data in code and focus on the invalidation workflow itself.

2. If we extended the deadline by another 24 hours, what’s the first thing you’d do?
I would add regression coverage for the pricing refresh and invalidation flow, including automated tests for saved audit replay, public link invalidation, and rerun behavior. That would make the backend state changes much safer before shipping.

3. Looking back at your Round 1 codebase as a now-experienced user of it: what’s one thing you would make harder or simpler?
I would make the public/shared audit state model simpler by separating the shared report payload from invalidation metadata earlier. Round 1 mixed audit output, pricing snapshots, and invalidation state more loosely, and this round I learned that explicit separation prevents stale UI data from leaking into the public view.
