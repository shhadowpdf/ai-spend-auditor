## 2026-05-20 12:00 - Start
Read assignment. Planning then build. Decide the approach

## 2026-05-20 18:00 - Round 2 re-audit work
Completed database-backed audit persistence and internal audit store.
Wired `getUserAudit()` to save audit inputs, output, and pricing snapshots.

## 2026-05-20 22:30 - Built audit persistence
Implemented `saveAudit()` and public audit creation in `backend/src/controller/tool.controller.js`, wiring the audit output into a shareable `publicId`.

## 2026-05-20 23:00 - 2026-05-21 7:00 - Sleep

## 2026-05-21 - 10:00 - Initial invalidation detector
Built `detectPricingChanges()` in `backend/src/utils/pricingDetectorChange.js` and wired the `/api/tools/detect-changes` route.

## 2026-05-20 14:00 - Hit the stale snapshot bug
Found that saved pricing snapshots were leaking live references from `pricingData`. Fixed it by deep cloning the snapshot objects during capture.

## 2026-05-20 16:45 - Frontend public audit refresh
Updated `frontend/src/pages/PublicAudit.tsx` so invalidated audits render the recalculated `currentReport` values rather than stale saved report fields.

## 2026-05-20 17:30 - Rerun and diff flow
Built the saved audit rerun endpoint and ensured public/internal audit records update cleanly after rerun.

## 2026-05-20 19:00 - Wrap-up
Tidied the PR notes, and validated the end-to-end shared audit experience.
