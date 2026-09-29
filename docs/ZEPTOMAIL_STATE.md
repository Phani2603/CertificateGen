# ZeptoMail & QStash Integration - State Tracker

## Current State: 🟡 Phase 1 (In Progress)

---

### 🟢 Phase 0: Prerequisites (COMPLETED)
- [x] Create Upstash (QStash) account and obtain tokens.
- [x] Configure ZeptoMail domain and obtain Send Mail token.
- [x] Add environment variables to `.env.local` (`ZEPTOMAIL_SEND_TOKEN`, `QSTASH_TOKEN`, etc.).
- [x] Verify environment variables are successfully loaded.

### 🟢 Phase 1: Client & Sanity Check (COMPLETED)
- [x] Build the standalone ZeptoMail REST API client (`lib/zeptomail-client.ts`).
- [x] Implement strict error classification (`ok`, `retry`, `permanent`, `config`).
- [x] Write a test script to send a real email to an inbox to verify Zoho acceptance.

### 🟢 Phase 2: Generic Data Model & Worker (COMPLETED)
- [x] Create the generic `EmailJob` MongoDB model (with `dedupeKey` and `lockedAt`).
- [x] Build the worker route (`/api/webhooks/email-worker/route.ts`).
- [x] Implement atomic claims for timeout recovery (idempotency).
- [x] Implement global MongoDB connection caching.
- [x] Manual endpoint testing (bypassing QStash).

### 🟢 Phase 3: QStash & Producer (COMPLETED)
- [x] Build the producer route (`/api/email/bulk-send/route.ts`) with Auth checks.
- [x] Implement database job creation with upsert/override capabilities for explicit resends.
- [x] Chunk QStash publishes in batches of 100 via `batchJSON`.
- [x] Configure QStash concurrency/parallelism limits (e.g., 5-10) in Upstash Dashboard.

### 🟢 Phase 4: Safety Net & UI (COMPLETED)
- [x] Set up ZeptoMail Webhook to capture bounces and update job status (`/api/webhooks/zeptomail-bounces/route.ts`).
- [x] Build the sweeper script (cron) to republish orphaned jobs (crashed in `sending` or stalled in `pending` because QStash publish failed mid-batch) and alert on configuration errors (`/api/cron/email-sweeper/route.ts`).
- [ ] Frontend integration. (UI buttons for "Send All" / "Resend")

### ⚪ Phase 5: Rollout
- [ ] Conduct a dry-run with ~20 real internal addresses.
- [ ] Verify full pipeline (Click -> QStash -> Worker -> ZeptoMail -> Inbox -> Bounce tracking).
- [ ] (Future) Safely decommission the legacy Nodemailer SMTP path once proven flawless.

---

## Implementation Log

**[2026-09-29 20:45] Phase 1 - ZeptoMail API Client Creation**
*   **What:** Created the native `fetch` API client and a manual testing script.
*   **Why:** To ensure we bypass SMTP for serverless compatibility, and explicitly categorize HTTP errors (`ok`, `retry`, `permanent`, `config`).
*   **Files:** `lib/zeptomail-client.ts`, `scripts/test-zeptomail.ts`.

**[2026-09-29 21:50] Phase 2 - Generic Model & Worker (Idempotency)**
*   **What:** Created the `EmailJob` schema and the `email-worker` webhook route with atomic locking.
*   **Why:** To guarantee idempotency (no double-sends on retries/double-clicks) and handle mid-flight crashes using `lockedAt`. Mongoose caching confirmed in `lib/mongodb.ts` to survive concurrent QStash hits.
*   **Files:** `models/EmailJob.ts`, `app/api/webhooks/email-worker/route.ts`.

**[2026-09-29 22:08] Phase 3 - Data Model Fix & Producer API**
*   **What:** Refactored `EmailJob` to use `{ certificateId, type }` as the unique index instead of a batch-specific dedupe key. Built the `/api/email/bulk-send` producer route handling both "Send All" (skipping already queued) and "Resend Selected" (upsert override).
*   **Why:** To perfectly match the exact semantics of "Send All" vs "Resend", allowing the database itself to handle deduplication natively while maintaining full override power for the admin. Chunked QStash payloads to 100 to beat Vercel's 60s execution limit.
*   **Files:** `models/EmailJob.ts`, `app/api/email/bulk-send/route.ts`.
**[2026-09-29 22:38] Phase 3.5 - Worker Hardening & Edge Cases**
*   **What:** Updated the worker route to return `429` on active lock denials, and enforced a hard ceiling on retries (max `5` attempts).
*   **Why:** 
    1. Returning 200 on an active lock silently deleted QStash retries. Returning 429 delays the retry. However, QStash retries are finite, meaning the true safety net for a crashed worker is still the Phase 4 Sweeper.
    2. Added a max-attempts check for `retry` errors to prevent infinite loops on perpetually failing network/rate limits. It now marks them `failed` after 5 attempts.
    3. **Tradeoff Acknowledged:** At-least-once delivery. If the process dies *after* ZeptoMail accepts the email but *before* the DB updates to `sent`, the job remains `sending` and will be re-sent later.
*   **Files:** `app/api/webhooks/email-worker/route.ts`.

**[2026-09-29 22:45] Phase 4 - Sweeper & Bounce Webhooks**
*   **What:** Created `/api/cron/email-sweeper/route.ts` and `/api/webhooks/zeptomail-bounces/route.ts`.
*   **Why:** 
    1. The Sweeper runs on a cron schedule to rescue jobs stuck in `sending` (worker crashed/QStash retries exhausted) AND `pending` (Producer publish failed mid-batch) for > 10 minutes. It automatically republishes them to QStash in batches of 100, resetting their `updatedAt` clock so they aren't double-swept.
    2. The Bounce webhook catches emails that were initially accepted by ZeptoMail (`sent`) but bounced later (e.g., inbox full). It finds the recent sent job and marks it as `bounced`.
*   **Files:** `app/api/cron/email-sweeper/route.ts`, `app/api/webhooks/zeptomail-bounces/route.ts`.
