-- Run ONLY on a NEW, independent, synthetic-data-only QA Supabase project.
-- Read-only catalog query. No employee rows, SQL mutations or live DB access.
WITH required_rpc(name) AS (VALUES
 ('admin_apply_personnel_batch_v3'),
 ('admin_cancel_personnel_batch_v2'),
 ('admin_change_employee_pin'),
 ('admin_delete_holiday_work_personnel_v2'),
 ('admin_reset_current_personnel_pins_v3'),
 ('admin_reset_data_v2'),
 ('admin_restore_data_v2'),
 ('admin_restore_personnel_snapshot_v3'),
 ('admin_restore_safety_backup_v2'),
 ('admin_save_holiday_work_personnel_v2'),
 ('admin_set_employee_account_status_v3'),
 ('admin_set_holiday_work_enabled_v2'),
 ('admin_set_holiday_work_month_confirmation'),
 ('change_own_pin_v2'),
 ('delete_attendance_personnel_v2'),
 ('delete_company_event_v4'),
 ('delete_my_fingerprint_photo'),
 ('delete_my_holiday_work_personnel_v2'),
 ('delete_my_memo_v2'),
 ('delete_my_memos_v2'),
 ('export_admin_data_v1'),
 ('export_my_data_v1'),
 ('get_account_status'),
 ('get_capacity_usage'),
 ('get_initial_pin_me_v1'),
 ('get_my_annual_leave_setting'),
 ('get_my_fingerprint_photo'),
 ('get_my_long_service_setting'),
 ('get_personnel_account_status'),
 ('get_personnel_change_impacts'),
 ('get_personnel_restore_revision_v1'),
 ('initial_pin_status_v1'),
 ('is_initial_pin'),
 ('list_attendance'),
 ('list_attendance_with_annual_leave'),
 ('list_company_events_v2'),
 ('list_data_safety_backups_v1'),
 ('list_employee_pin_status'),
 ('list_holiday_work'),
 ('list_holiday_work_eligibility'),
 ('list_holiday_work_eligibility_v2'),
 ('list_holiday_work_month_confirmations'),
 ('list_my_annual_leave_attendance'),
 ('list_my_fingerprint_records'),
 ('list_my_holiday_work'),
 ('list_my_long_service_attendance'),
 ('list_my_long_service_exclusions'),
 ('list_my_memo_ddays'),
 ('list_my_memos'),
 ('list_overtime_entries'),
 ('list_personnel_account_events'),
 ('list_personnel_assignments'),
 ('list_personnel_snapshots'),
 ('list_recent_audit_page'),
 ('logout_employee'),
 ('preview_admin_reset_data_v2'),
 ('preview_current_personnel_pin_reset_v1'),
 ('preview_data_restore_v2'),
 ('preview_safety_backup_restore_v2'),
 ('restore_my_data_v2'),
 ('save_attendance_personnel_v2'),
 ('save_attendance_with_annual_leave_personnel_v2'),
 ('save_company_event_v4'),
 ('save_my_annual_leave_setting_v2'),
 ('save_my_fingerprint_photo'),
 ('save_my_holiday_work_personnel_v2'),
 ('save_my_long_service_profile_v2'),
 ('save_my_memo_v2'),
 ('save_my_overtime_day_v2'),
 ('save_my_overtime_entry_v2'),
 ('set_my_fingerprint_confirmed'),
 ('set_my_memo_dday')
)
SELECT name AS expected_rpc,
 CASE WHEN name IN ('admin_reset_data_v2','admin_restore_data_v2','admin_restore_safety_backup_v2')
        THEN 'SUPPORT_HOLD_NO_EXECUTION'
      WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=name)
        THEN 'NAME_PRESENT_SIGNATURE_UNVERIFIED'
      ELSE 'MISSING' END AS name_gate
FROM required_rpc ORDER BY name;

WITH required_table(name) AS (VALUES
 ('employees'),
 ('app_sessions'),
 ('attendance_entries'),
 ('audit_logs'),
 ('maintenance_schedule_state'),
 ('holiday_work_entries'),
 ('holiday_work_month_confirmations'),
 ('annual_leave_settings'),
 ('long_service_settings'),
 ('long_service_exclusions'),
 ('fingerprint_punch_records'),
 ('overtime_entries'),
 ('personal_memos'),
 ('memo_dday_selections'),
 ('company_events'),
 ('personnel_batches'),
 ('personnel_actions'),
 ('personnel_account_events'),
 ('personnel_snapshots'),
 ('holiday_work_eligibility'),
 ('site_update_history'),
 ('realtime_signals'),
 ('data_safety_backups')
)
SELECT name AS expected_table, to_regclass(format('public.%I',name)) IS NOT NULL AS installed_in_qa FROM required_table ORDER BY name;

-- 2026-10-26: READ-ONLY QA-only exact input signature gate.
-- Name-only RPC existence checks cannot verify PostgREST named-argument routing.
-- Never run against the operational project or use this SQL to test the
-- three held restore/reset RPCs. A matching signature is NOT Auth/RLS/E2E PASS.
-- QA-only holiday-work v2 requirements intentionally stay REVIEW until the
-- frontend's 4th arg type/key and returned three columns are verified.
WITH required(name, args_expected, result_expected, mode) AS (
 VALUES
 ('get_personnel_restore_revision_v1','p_token uuid','text','EXACT'),
 ('admin_set_employee_account_status_v3','p_token uuid, p_employee_id smallint, p_account_status text, p_effective_date date, p_note text, p_expected jsonb, p_expected_revision text','boolean','EXACT'),
 ('admin_apply_personnel_batch_v3','p_token uuid, p_effective_date date, p_note text, p_items jsonb, p_replace_batch_id bigint, p_mode text, p_expected jsonb, p_expected_revision text','jsonb','EXACT'),
 ('admin_cancel_personnel_batch_v2','p_token uuid, p_batch_id bigint, p_expected_batch jsonb, p_expected_revision text','boolean','EXACT'),
 ('admin_restore_personnel_snapshot_v3','p_token uuid, p_snapshot_id bigint, p_admin_pin text, p_expected_revision text','boolean','EXACT'),
 ('preview_current_personnel_pin_reset_v1','p_token uuid','jsonb','EXACT'),
 ('admin_reset_current_personnel_pins_v3','p_token uuid, p_admin_pin text, p_expected_revision text','integer','EXACT'),
 ('admin_set_holiday_work_enabled_v2',NULL,'boolean','QA_FOUR_INPUTS'),
 ('list_holiday_work_eligibility_v2','p_token uuid',NULL,'QA_THREE_COLUMNS')
), observed AS (
 SELECT p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args,
        pg_get_function_result(p.oid) AS return_type, p.pronargs AS argc,
        count(*) OVER (PARTITION BY p.proname) AS overload_count,
        row_number() OVER (PARTITION BY p.proname ORDER BY p.oid) AS candidate_number
 FROM pg_catalog.pg_proc p
 JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind='f'
)
SELECT r.name AS expected_rpc,
 CASE WHEN o.name IS NULL THEN 'BLOCKED_MISSING'
      WHEN o.overload_count<>1 THEN 'BLOCKED_OVERLOAD_REVIEW_REQUIRED'
      WHEN r.mode='EXACT'
           AND o.args=r.args_expected AND o.return_type=r.result_expected
        THEN 'SIGNATURE_MATCH_NOT_E2E'
      WHEN r.mode='QA_FOUR_INPUTS'
           AND o.argc=4
           AND o.args LIKE 'p_token uuid, p_employee_id smallint, p_enabled boolean, %'
           AND o.return_type='boolean'
        THEN 'SHAPE_MATCH_4TH_ARGUMENT_REVIEW_REQUIRED'
      WHEN r.mode='QA_THREE_COLUMNS'
           AND o.args=r.args_expected
           AND o.return_type LIKE 'TABLE(%'
           AND length(o.return_type)-length(replace(o.return_type,',',''))=2
        THEN 'SHAPE_MATCH_RETURN_COLUMNS_REVIEW_REQUIRED'
      ELSE 'BLOCKED_SIGNATURE_OR_RETURN_MISMATCH'
 END AS contract_gate
FROM required r LEFT JOIN observed o ON o.name=r.name AND o.candidate_number=1
ORDER BY r.mode,r.name;
