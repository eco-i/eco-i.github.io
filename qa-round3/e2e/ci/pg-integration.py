#!/usr/bin/env python3
"""Actual PostgreSQL concurrency against the committed QA SQL RPC functions.
Synthetic CI-only identity and tables; NOT full Supabase or whole-app E2E.
"""
import os
import subprocess
import time

ADMIN = "11111111-1111-4111-8111-111111111111"
WORKER = "22222222-2222-4222-8222-222222222222"
DAY = "2027-05-13"
WITH_HOLIDAY = '{"periods":[],"overrides":[],"holidays":[{"date":"2027-05-13","title":"합성 휴일"}],"excludedHolidays":[]}'
WITHOUT_HOLIDAY = '{"periods":[],"overrides":[],"holidays":[],"excludedHolidays":[]}'
env = os.environ.copy()
if env.get("PGHOST") != "127.0.0.1" or env.get("PGDATABASE") != "qa_round3" or env.get("PGPORT") != "5432":
    raise SystemExit("FAIL CLOSED: Only loopback synthetic qa_round3 Postgres accepted")
env["PGOPTIONS"] = "-c statement_timeout=15000 -c lock_timeout=12000"
cmd = ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-q", "-A", "-t"]

def run(sql, ok=True):
    r = subprocess.run(cmd + ["-c", sql], env=env, capture_output=True, text=True, timeout=20)
    if (r.returncode == 0) != ok:
        raise AssertionError(f"Unexpected database outcome: {r.returncode} {r.stdout} {r.stderr}")
    return (r.stdout + r.stderr).strip()

def reset():
    run("TRUNCATE public.holiday_work_entries, public.audit_logs RESTART IDENTITY; "
        "UPDATE public.maintenance_schedule_state SET revision=0, data='"
        + WITH_HOLIDAY + "'::jsonb")

def conflict(first, second, expected_error, description):
    # First transaction must reach its 3-second in-transaction sleep BEFORE
    # second transaction starts. At that point SQL RPC mutation is complete
    # but PostgreSQL still holds its row lock until COMMIT.
    leader = subprocess.Popen(cmd + ["-c", "BEGIN; " + first + "; SELECT pg_sleep(3); COMMIT;"],
                              env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    follower = None
    try:
        deadline = time.monotonic() + 8
        while time.monotonic() < deadline:
            activity = run("SELECT count(*) FROM pg_stat_activity "
                           "WHERE pid<>pg_backend_pid() AND datname=current_database() "
                           "AND wait_event='PgSleep'")
            if int(activity) > 0:
                break
            if leader.poll() is not None:
                raise AssertionError("First SQL transaction ended before the lock rendezvous")
            time.sleep(0.05)
        else:
            raise AssertionError("First SQL transaction never acquired the lock")
        follower = subprocess.Popen(cmd + ["-c", second], env=env,
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        out2, err2 = follower.communicate(timeout=18)
        out1, err1 = leader.communicate(timeout=18)
        if leader.returncode != 0 or follower.returncode == 0 or expected_error not in err2:
            raise AssertionError(f"{description} failed: leader={leader.returncode}:{err1} "
                                 f"follower={follower.returncode}:{err2} {out1} {out2}")
        print(f"PASS {description}: second transaction blocked/rejected as {expected_error}", flush=True)
    finally:
        for p in (leader, follower):
            if p is not None and p.poll() is None:
                p.kill()
                p.communicate()

reset()
invalid = run(f"SELECT public.save_my_holiday_work('{ADMIN}','{DAY}','09:00','18:00')", ok=False)
assert "SYNTHETIC_INVALID_SESSION" in invalid
print("PASS synthetic invalid identity fails closed", flush=True)

run(f"SELECT public.save_my_holiday_work('{WORKER}','{DAY}','09:00','18:00')")
assert run("SELECT count(*) FROM public.holiday_work_entries") == "1"
assert run("SELECT net_minutes FROM public.holiday_work_entries") == "540"
print("PASS live PostgreSQL accepted/stored synthetic holiday work", flush=True)

reset()
conflict(f"SELECT public.save_my_holiday_work('{WORKER}','{DAY}','09:00','18:00')",
         f"SELECT public.admin_save_maintenance_schedule('{ADMIN}',0,'{WITHOUT_HOLIDAY}'::jsonb)",
         "HOLIDAY_WORK_HISTORY_CONFLICT", "holiday-work before schedule change")
assert run("SELECT count(*) FROM public.holiday_work_entries") == "1"
assert run("SELECT revision FROM public.maintenance_schedule_state") == "0"
print("PASS history preserved on conflicting schedule", flush=True)

reset()
conflict(f"SELECT public.admin_save_maintenance_schedule('{ADMIN}',0,'{WITHOUT_HOLIDAY}'::jsonb)",
         f"SELECT public.save_my_holiday_work('{WORKER}','{DAY}','09:00','18:00')",
         "NOT_HOLIDAY", "schedule change before holiday-work")
assert run("SELECT count(*) FROM public.holiday_work_entries") == "0"
assert run("SELECT revision FROM public.maintenance_schedule_state") == "1"
print("PASS declassified holiday cannot gain work history", flush=True)

reset()
conflict(f"SELECT public.admin_save_maintenance_schedule('{ADMIN}',0,'{WITH_HOLIDAY}'::jsonb)",
         f"SELECT public.admin_save_maintenance_schedule('{ADMIN}',0,'{WITHOUT_HOLIDAY}'::jsonb)",
         "STALE_MAINTENANCE_SCHEDULE", "two-admin schedule revision CAS")
assert run("SELECT revision FROM public.maintenance_schedule_state") == "1"
print("PASS only one schedule update applied", flush=True)
print("SQL_SCOPE_PASS ONLY: full authenticated browser/Supabase E2E remains UNVERIFIED", flush=True)
