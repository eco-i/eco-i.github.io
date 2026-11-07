#!/usr/bin/env python3
"""Reuse the existing QA overtime-only Chromium->synthetic PostgreSQL exercise.
Only changes the runner branch guard and uses the already installed local Chrome.
The original 3-8 QA test, operating app, and database are never modified.
"""
import importlib.util
import os
import sys
from contextlib import contextmanager
from pathlib import Path
from types import SimpleNamespace

from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
NAME="workmoa_existing_overtime_harness_for_integration"
spec=importlib.util.spec_from_file_location(NAME,HERE/"browser-fingerprint-overtime-success.py")
lab=importlib.util.module_from_spec(spec)
sys.modules[NAME]=lab
spec.loader.exec_module(lab)
br=lab.br
BRANCH="refs/heads/qa-round3-overtime-integration-20261107"

def integration_guard():
    assert os.environ.get("GITHUB_REPOSITORY")=="eco-i/eco-i.github.io", "WRONG_REPOSITORY"
    assert os.environ.get("GITHUB_REF")==BRANCH, "WRONG_INTEGRATION_BRANCH"
    expected={
        "PGHOST":"127.0.0.1",
        "PGPORT":"5432",
        "PGUSER":"qa_runner",
        "PGDATABASE":"qa_round3",
        "PGPASSWORD":"synthetic_ci_only_not_a_real_secret"
    }
    for key,value in expected.items():
        assert os.environ.get(key)==value, "QA_DATABASE_SCOPE_MISMATCH_"+key
    for key in (
        "DATABASE_URL","SUPABASE_URL","SUPABASE_ACCESS_TOKEN",
        "SUPABASE_DB_PASSWORD","QA_SUPABASE_URL","QA_SUPABASE_ANON_KEY",
        "DOCKER_HOST","DOCKER_CONTEXT"
    ):
        assert not os.environ.get(key), "QA_EXTERNAL_DATABASE_DENIED_"+key
    executable=os.environ.get("QA_CHROMIUM_EXECUTABLE","")
    assert executable and os.path.isabs(executable) and os.path.isfile(executable), "QA_LOCAL_CHROME_REQUIRED"

@contextmanager
def runner_chromium():
    path=os.environ["QA_CHROMIUM_EXECUTABLE"]
    with sync_playwright() as original:
        # Existing harness uses only p.chromium.launch(). Provide a proxy
        # instead of changing the original test or Playwright library globals.
        def launch(*args,**kwargs):
            assert "executable_path" not in kwargs and "channel" not in kwargs, "QA_EXPLICIT_CHROME_OVERRIDE_DENIED"
            return original.chromium.launch(*args,executable_path=path,**kwargs)
        yield SimpleNamespace(chromium=SimpleNamespace(launch=launch))

if __name__=="__main__":
    integration_guard()
    # Enforce *our* equally strict branch-sensitive isolated runner guard.
    # The original helper requires qa-3-8; it is unchanged on disk.
    br.require_env=integration_guard
    lab.sync_playwright=runner_chromium
    sys.argv=[str(HERE/"browser-fingerprint-overtime-success.py"),"--overtime-only"]
    lab.main()
    print("OVERTIME_INTEGRATION_REAL_CHROMIUM_SYNTHETIC_PG_SAVE_EDIT_CAS_PASS",flush=True)
