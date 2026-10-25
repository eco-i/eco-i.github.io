#!/usr/bin/env python3
"""Read-only/offline inventory of public QA app RPC literals and incremental SQL.

This checks source coverage, NOT availability, Auth, RLS, SQL compilability,
or behavior in any deployed Supabase service. It never executes SQL.
Uses standard-library only; no network, DB client, subprocess, credentials or import hooks.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASELINE = ROOT / "qa-round3/e2e/ci/backend-rebuild-readiness-baseline.json"
RPC_LITERAL = re.compile(r"\brpc\s*\(\s*(['\"])([a-z_][a-z0-9_]*)\1", re.I)
FUNCTION_DDL = re.compile(
    r"\bcreate\s+(?:or\s+replace\s+)?function\s+"
    r"(?:(?:public|workmoa_guard)\.)?([a-z_][a-z0-9_]*)\s*\(", re.I
)
TABLE_DDL = re.compile(
    r"\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?"
    r"(?:(?:public|workmoa_guard)\.)?([a-z_][a-z0-9_]*)\s*\(", re.I
)
RELATION_REFERENCES = re.compile(
    r"\b(?:from|join|update|insert\s+into|alter\s+table|delete\s+from|references)\s+"
    r"(?:only\s+)?(?:public|workmoa_guard)\.([a-z_][a-z0-9_]*)\b", re.I
)

def match_names(pattern: re.Pattern[str], body: str, group: int = 1) -> list[str]:
    return [m.group(group).lower() for m in pattern.finditer(body)]

def inventory(html: str, migrations: dict[str, str]) -> dict:
    if not migrations or not html:
        raise ValueError("missing app or migrations: cannot claim QA coverage")
    calls = match_names(RPC_LITERAL, html, 2)
    if not calls:
        raise ValueError("no literal rpc calls: parser/source changed; stop")
    rpc = set(calls)
    declared_functions: set[str] = set()
    declared_tables: set[str] = set()
    sql_dependencies: set[str] = set()
    for filename, sql in migrations.items():
        if not filename.endswith(".sql"):
            raise ValueError("unexpected non-SQL migration")
        declared_functions.update(match_names(FUNCTION_DDL, sql))
        declared_tables.update(match_names(TABLE_DDL, sql))
        sql_dependencies.update(match_names(RELATION_REFERENCES, sql))
    matched = sorted(rpc & declared_functions)
    gaps = sorted(rpc - declared_functions)
    missing_dependent_relations = sorted(sql_dependencies - declared_tables)
    return {
        "migration_file_count": len(migrations),
        "rpc_literal_callsite_count": len(calls),
        "rpc_literals_unique_count": len(rpc),
        "sql_create_function_unique_count": len(declared_functions),
        "sql_create_table_unique_count": len(declared_tables),
        "direct_name_match_count": len(matched),
        "unbacked_rpc_count": len(gaps),
        "direct_name_matches": matched,
        "table_ddl_names": sorted(declared_tables),
        "rpc_gap_names": gaps,
        "sql_related_relations_uncreated_here": missing_dependent_relations,
    }

# Fields in the frozen baseline are deliberately the ONLY release-gating fields.
# The extra relation-reference inventory is advisory (regex over SQL, not parser).
BASELINE_FIELDS = (
    "migration_file_count", "rpc_literal_callsite_count", "rpc_literals_unique_count",
    "sql_create_function_unique_count", "sql_create_table_unique_count",
    "direct_name_match_count", "unbacked_rpc_count",
    "direct_name_matches", "table_ddl_names", "rpc_gap_names",
    "sql_related_relations_uncreated_here",
)

def baseline_drift(actual: dict, baseline: dict) -> list[str]:
    return [k for k in BASELINE_FIELDS if actual.get(k) != baseline.get(k)]

def self_test() -> None:
    sample = 'rpc("one"); rpc(\'two\'); rpc(dynamicName); rpc("one");'
    assert match_names(RPC_LITERAL, sample, 2) == ["one", "two", "one"]
    sql = ("CREATE TABLE IF NOT EXISTS public.work (id int);\n"
           "CREATE OR REPLACE FUNCTION public.one() RETURNS int AS $$ "
           "SELECT 1 $$ LANGUAGE sql;\n"
           "CREATE FUNCTION public.helper() RETURNS int AS $$ SELECT 2 $$ LANGUAGE sql;\n"
           "SELECT * FROM public.work JOIN public.existing ON true;")
    got = inventory(sample, {"a.sql": sql})
    assert got["rpc_literals_unique_count"] == 2
    assert got["direct_name_matches"] == ["one"]
    assert got["rpc_gap_names"] == ["two"]
    assert got["sql_create_table_unique_count"] == 1
    assert got["sql_create_function_unique_count"] == 2
    assert "existing" in got["sql_related_relations_uncreated_here"]
    assert baseline_drift(got, got) == []
    assert baseline_drift(got, {**got, "unbacked_rpc_count": 999}) == ["unbacked_rpc_count"]
    print("BACKEND_AUDIT_SELFTEST_PASS 9 source/parser and fail-closed checks", flush=True)

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--check-baseline", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    app = ROOT / "index.html"
    migration_dir = ROOT / "db/migrations"
    html = app.read_text(encoding="utf-8")
    source_files = sorted(migration_dir.glob("*.sql"))
    if not source_files:
        raise ValueError("no migration SQL found; STOP")
    migrations = {p.name: p.read_text(encoding="utf-8") for p in source_files}
    actual = inventory(html, migrations)
    if args.check_baseline:
        expected = json.loads(BASELINE.read_text(encoding="utf-8"))
        changed = baseline_drift(actual, expected)
        if changed:
            print("BACKEND_STATIC_BASELINE_DRIFT " + ",".join(changed), file=sys.stderr)
            print("Code or migration changed; re-audit before updating QA baseline.", file=sys.stderr)
            return 1
    print("BACKEND_PUBLIC_SOURCE_AUDIT " + json.dumps(actual, sort_keys=True, ensure_ascii=False))
    print("BACKEND_SCOPE_ONLY public incremental SQL coverage; NOT deployed RPC or full schema readiness")
    if args.check_baseline:
        print("BACKEND_STATIC_BASELINE_PASS exact app/SQL coverage snapshot confirmed")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print("BACKEND_STATIC_AUDIT_BLOCKED " + str(exc), file=sys.stderr)
        raise SystemExit(2)
