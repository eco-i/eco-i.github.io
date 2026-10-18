-- 2026-10-18: Treat every February 12 as a company-only holiday, with NO compensatory day off.
-- Match existing weekend and statutory holiday functions; preserve their original date tables.
-- Existing function signatures, immutability and permission grants remain unchanged.

CREATE OR REPLACE FUNCTION public._is_holiday_work_day(p_date date)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  select p_date is not null and (
    extract(dow from p_date)::int in (0,6)
    or (extract(month from p_date)::int = 2 and extract(day from p_date)::int = 12)
    or p_date in (
      date '2026-01-01',date '2026-02-16',date '2026-02-17',date '2026-02-18',
      date '2026-03-01',date '2026-03-02',date '2026-05-01',date '2026-05-05',
      date '2026-05-24',date '2026-05-25',date '2026-06-03',date '2026-06-06',
      date '2026-07-17',date '2026-08-15',date '2026-08-17',date '2026-09-24',
      date '2026-09-25',date '2026-09-26',date '2026-10-03',date '2026-10-05',
      date '2026-10-09',date '2026-12-25',
      date '2027-01-01',date '2027-02-06',date '2027-02-07',date '2027-02-08',
      date '2027-02-09',date '2027-03-01',date '2027-05-01',date '2027-05-03',
      date '2027-05-05',date '2027-05-13',date '2027-06-06',date '2027-07-17',
      date '2027-07-19',date '2027-08-15',date '2027-08-16',date '2027-09-14',
      date '2027-09-15',date '2027-09-16',date '2027-10-03',date '2027-10-04',
      date '2027-10-09',date '2027-10-11',date '2027-12-25',date '2027-12-27'
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public._personnel_is_holiday(p_date date)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select extract(isodow from p_date) in (6,7)
     or (extract(month from p_date)::int = 2 and extract(day from p_date)::int = 12)
     or p_date = any(array[
      date '2026-01-01',date '2026-02-16',date '2026-02-17',date '2026-02-18',date '2026-03-01',date '2026-03-02',
      date '2026-05-01',date '2026-05-05',date '2026-05-24',date '2026-05-25',date '2026-06-03',date '2026-06-06',
      date '2026-07-17',date '2026-08-15',date '2026-08-17',date '2026-09-24',date '2026-09-25',date '2026-09-26',
      date '2026-10-03',date '2026-10-05',date '2026-10-09',date '2026-12-25',
      date '2027-01-01',date '2027-02-06',date '2027-02-07',date '2027-02-08',date '2027-02-09',date '2027-03-01',
      date '2027-05-01',date '2027-05-03',date '2027-05-05',date '2027-05-13',date '2027-06-06',date '2027-07-17',
      date '2027-07-19',date '2027-08-15',date '2027-08-16',date '2027-09-14',date '2027-09-15',date '2027-09-16',
      date '2027-10-03',date '2027-10-04',date '2027-10-09',date '2027-10-11',date '2027-12-25',date '2027-12-27'
    ]);
$function$;
