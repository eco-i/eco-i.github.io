#!/usr/bin/env python3
"""Build NONDEPLOYABLE, EMPTY table shells in an isolated PostgreSQL QA schema.

Input: a locally supplied read-only TABLE METADATA JSON, not employee rows.
The program never connects to a DB, invokes Supabase, executes SQL, or exports
the metadata. This is not an original RLS/Auth/RPC/trigger/constraint rebuild.

SAFETY: Output ONLY in workmoa_synthetic_qa schema; no public/workmoa_guard
objects, and no grants to PUBLIC/anon/authenticated.
"""
import argparse
import json
import re
import sys
from pathlib import Path

QA_SCHEMA = "workmoa_synthetic_qa"
ALLOWED_TYPES = {
    "bigint", "boolean", "bytea", "date", "integer", "jsonb", "smallint",
    "text", "text[]", "time without time zone", "timestamp with time zone", "uuid",
}
IDENT = re.compile(r"^[a-z_][a-z0-9_]{0,62}$")
FORBIDDEN_TOP = {"rows", "data", "secrets", "passwords", "tokens", "records"}
MAX_TABLES, MAX_COLS, MAX_BYTES = 100, 50, 250000

def checked_name(name):
    if not isinstance(name, str) or not IDENT.fullmatch(name):
        raise ValueError("unsafe or invalid SQL identifier")
    return name

def quote(name):
    return '"' + checked_name(name) + '"'

def build_sql(payload):
    if not isinstance(payload, dict) or any(k.lower() in FORBIDDEN_TOP for k in payload):
        raise ValueError("wrong input type or data-bearing top-level member")
    if payload.get("purpose") != "READ-ONLY METADATA SNAPSHOT - NOT SCHEMA DDL AND NOT DEPLOYABLE":
        raise ValueError("input not an approved read-only metadata-only snapshot")
    tables = payload.get("tables")
    if not isinstance(tables, list) or not 1 <= len(tables) <= MAX_TABLES:
        raise ValueError("no tables or excessive number")
    output = [
        "-- SYNTHETIC QA ONLY. NEVER DEPLOY TO OPERATING SUPABASE.",
        "-- GENERATED EMPTY TABLE SHELLS. NO ORIGINAL ACL/FK/TRIGGERS/FUNCTIONS/RLS POLICIES.",
        "BEGIN;",
        "CREATE SCHEMA IF NOT EXISTS " + quote(QA_SCHEMA) + ";",
        "REVOKE ALL ON SCHEMA " + quote(QA_SCHEMA) + " FROM PUBLIC;",
    ]
    seen = set()
    total = 0
    for table in tables:
        if not isinstance(table, dict) or set(table) != {"name", "kind", "schema", "columns"}:
            raise ValueError("table entry has unknown fields")
        if table["schema"] not in ("public", "workmoa_guard"):
            raise ValueError("unsupported source namespace")
        table_name = checked_name(table["name"])
        if table_name in seen:
            raise ValueError("duplicate table name")
        seen.add(table_name)
        if table["kind"] not in ("r", "p"):
            raise ValueError("unsupported table kind")
        columns = table["columns"]
        if not isinstance(columns, list) or not 1 <= len(columns) <= MAX_COLS:
            raise ValueError("no columns or excessive number")
        chunks = []
        local = set()
        for col in columns:
            if not isinstance(col, dict) or set(col) != {
                "name", "type", "identity", "not_null", "generated", "default_md5"
            }:
                raise ValueError("unexpected column fields: possible raw data")
            name = checked_name(col["name"])
            if name in local:
                raise ValueError("duplicate column")
            local.add(name)
            datatype = col["type"]
            if datatype not in ALLOWED_TYPES:
                raise ValueError("column datatype not allowlisted")
            if type(col["not_null"]) is not bool:
                raise ValueError("not_null must be boolean")
            # Original default MD5 alone cannot reconstruct a default expression.
            # Preserve only type and NOT NULL; PostgreSQL identity is structural.
            if col["generated"] not in ("", None):
                raise ValueError("generated expressions require original DDL")
            identity = col["identity"]
            if identity not in ("", None, "a", "d"):
                raise ValueError("unknown identity setting")
            if identity and datatype not in ("bigint", "integer", "smallint"):
                raise ValueError("identity on noninteger column")
            if col["default_md5"] is not None and (
                not isinstance(col["default_md5"], str) or
                not re.fullmatch(r"[0-9a-f]{32}", col["default_md5"])
            ):
                raise ValueError("unexpected default metadata")
            piece = "    " + quote(name) + " " + datatype
            if identity:
                piece += " GENERATED " + ("ALWAYS" if identity == "a" else "BY DEFAULT") + " AS IDENTITY"
            if col["not_null"]:
                piece += " NOT NULL"
            chunks.append(piece)
            total += 1
        target = quote(QA_SCHEMA) + "." + quote(table_name)
        output += [
            "CREATE TABLE " + target + " (",
            ",\n".join(chunks),
            ");",
            "ALTER TABLE " + target + " ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE " + target + " FORCE ROW LEVEL SECURITY;",
            "REVOKE ALL ON TABLE " + target + " FROM PUBLIC;",
        ]
    output.append("COMMIT;")
    # Return ONLY SQL in isolated schema. Don't output original metadata, project ID
    # or function signatures. No row values anywhere in the input schema.
    return "\n".join(output) + "\n", (len(seen), total)

def sample_input():
    # FAKE sample with 2 short names, never production table names/columns.
    return {"purpose": "READ-ONLY METADATA SNAPSHOT - NOT SCHEMA DDL AND NOT DEPLOYABLE",
            "tables": [
                {"kind":"r","schema":"public","name":"qa_actor",
                 "columns":[
                  {"name":"id","type":"smallint","not_null":True,"identity":"",
                   "generated":"","default_md5":None},
                  {"name":"note","type":"text","not_null":False,"identity":"",
                   "generated":"","default_md5":None}
                 ]},
                {"kind":"r","schema":"public","name":"qa_marker",
                 "columns":[
                  {"name":"id","type":"bigint","not_null":True,"identity":"d",
                   "generated":"","default_md5":None},
                  {"name":"created","type":"timestamp with time zone","not_null":False,
                   "identity":"","generated":"","default_md5":None}
                 ]},
            ]}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", action="store_true", help="Use fabricated 2-table non-sensitive fixture")
    parser.add_argument("--metadata", type=Path, help="Local read-only metadata JSON file (never uploaded)")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        obj = sample_input()
        sql, counts = build_sql(obj)
        assert counts == (2,4)
        assert '"workmoa_synthetic_qa"."qa_actor"' in sql
        assert "FORCE ROW LEVEL SECURITY" in sql
        assert "GRANT " not in sql and 'CREATE TABLE "public".' not in sql
        assert "BY DEFAULT AS IDENTITY" in sql
        for bad in (
            {**obj, "rows":[{"password":"bad"}]},
            {**obj, "purpose":"unknown"},
            {**obj, "tables":[{**obj["tables"][0], "schema":"auth"}]},
            {**obj, "tables":[{**obj["tables"][0], "name":"qa_actor; DROP TABLE x"}]},
        ):
            try:
                build_sql(bad)
            except ValueError:
                pass
            else:
                raise AssertionError("Unsafe input accepted")
        print("QA_TABLE_SHELL_SELFTEST_PASS 9 checks", flush=True)
        return
    if args.fixture == bool(args.metadata):
        parser.error("select exactly one of --fixture or --metadata")
    if args.fixture:
        payload = sample_input()
    else:
        if not args.metadata.is_file() or args.metadata.stat().st_size > MAX_BYTES:
            parser.error("missing or oversized metadata")
        payload = json.loads(args.metadata.read_text(encoding="utf-8"))
    sql, _ = build_sql(payload)
    sys.stdout.write(sql)

if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, json.JSONDecodeError) as e:
        sys.stderr.write("QA_TABLE_SHELL_BLOCKED " + type(e).__name__ + "\n")
        sys.exit(2)
