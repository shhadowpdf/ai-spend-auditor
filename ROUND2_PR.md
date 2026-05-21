## What this PR does
This PR completes the Round 2 audit persistence and invalidation flow for Credex. It saves submitted audit inputs, outputs, and pricing snapshots in the backend, detects when shared audits become stale after a pricing update, and updates the public audit UI so invalidated audits display the recalculated current report values.

## Why
Accurate pricing refresh behavior is critical for shared audits. Without a proper snapshot and invalidation flow, public audit links could show stale recommendations and savings after a price change, which erodes trust and breaks the product's core promise. This work ensures that updates are detectable, reflected in the UI, and that saved audits can be rerun cleanly.

## How it works
- Backend saves each audit by creating a public audit record and an internal audit record with `inputStack`, `outputResult`, and a deep-cloned `pricingSnapshot`.
- `detectPricingChanges()` reruns saved audits and compares the stored snapshot to the current pricing catalogue. If a pricing delta or report change is detected, the audit is marked invalidated and a `changeSummary` is persisted.
- The public audit page fetches the shared audit report plus the internal audit metadata. When invalidated, the frontend now renders the recalculated `currentReport` data instead of stale saved summary fields.
- The `round` diff page and rerun endpoint both use the saved inputs to regenerate outputs and restore the audit to a fresh state.
- The backend now deep-clones pricing snapshot objects so stored snapshots are immutable and do not drift when the live pricing catalogue is updated.
- This work was built directly on the existing Round 1 codebase without rewriting the app from scratch, with honest documentation of the current code state and the issues encountered.

## What I cut
- I did not add a dedicated admin pricing editor or UI for non-engineers to update tool prices.
- I did not build a separate audit rollback or version history feature.
- I did not add unsubscribe links or notification preference management for pricing alert emails.
- I kept the pricing catalogue as hardcoded JS data rather than moving it to a database-backed catalogue.

## How to test it manually
1. Run backend and frontend locally.
2. Submit an audit with Cursor Pro for $20 and copy the returned public audit ID or link.
3. Change the pricing data in `backend/src/data/pricingData.js` so Cursor Pro is $15.
4. Call `GET /api/tools/detect-changes` and verify the API returns the saved audit as affected.
5. Open the public audit URL and confirm it shows invalidated pricing, updated savings, and the changed pricing item.
6. Visit `/audit/diff/<publicId>` and confirm the diff page reflects the updated report and rerun endpoint works.

## What's tested
- Backend audit engine and report composition were verified by existing node tests.
- Verified the public audit page builds successfully with `npm run build` in frontend.
- Manually tested the pricing update flow, invalidation banner, and current report refresh on shared audits.

## Open questions / risks
- If Supabase is unavailable, the in-memory fallback works locally but shared audits will not survive server restarts.
- Public audit invalidation currently depends on the saved pricing snapshot shape; future catalogue schema changes may require migration logic.
- Notification batching is functional, but the email copy and retry behavior should be reviewed before production traffic.
