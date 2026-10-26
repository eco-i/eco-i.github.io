-- QA CI fixture only. This is NOT a Workmoa employee table.
-- Execute exclusively in a brand-new, unlinked, temporary Supabase local stack.
-- No live records, keys, RPC bodies or production migrations.
CREATE TABLE public.workmoa_ci_probe (
  probe_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message text NOT NULL
);
ALTER TABLE public.workmoa_ci_probe ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workmoa_ci_probe FROM public, anon, authenticated;
GRANT SELECT, INSERT ON public.workmoa_ci_probe TO anon;
-- The anon grant alone must NOT bypass RLS (no policy exists).
-- The seeded row is synthetic, solely to verify RLS invisibility.
INSERT INTO public.workmoa_ci_probe(message) VALUES ('LOCAL_SYNTHETIC_CI_SEEDED');
