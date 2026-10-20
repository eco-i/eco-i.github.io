# QA-only server readiness — 3-8-49

**Read-only GitHub source inspection; no production DB accessed.**

- Current QA HTML has **71 different literal RPC calls**. The 16 files under `db/migrations/*.sql` define **3 matching RPC function names**; **68 of 71 aren't supplied by these incremental migrations**. This does NOT mean those functions are missing in the working production database. It means the repository lacks a complete clean-room QA server baseline.
- Missing from baseline: employees, app_sessions, core session/admin helpers, fingerprint, attendance and recovery RPC definitions, critical underlying tables and permissions. Blindly running incremental SQL in a new empty project is not a functional installation.
- `qa-schema-preflight.sql`: read-only catalog check for all 71 RPC names and 23 key table names. **Run only in a separate QA project with synthetic records; never on SongdoFood or any live employee database.** Names existing do not prove RLS or function security or signature correctness.
- A complete, sanitised server schema must be produced from non-sensitive requirements or explicitly approved DDL, NOT operational backup/table records/auth secrets. No QA server has been created; no live E2E executed.
- The site's production credential constant uses **`sb_publishable_`**. QA site preparer updated to support a separately verified QA publishable key as well as legacy anon JWT, refuse production URL/key and service secret, require QA_PROJECT_REF match and an explicit dashboard ownership check for publishable keys. The confirmation is a manual safeguard, not cryptographic proof.
- 13 local Node 22 synthetic offline safety tests passed. Re-run: `node --test qa-round3/e2e/prepare-qa-site.test.mjs`. No actual browser/Supabase read/write occurred.

KST 2026-10-20T20:50:38+09:00.
