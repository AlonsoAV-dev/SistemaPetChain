BEGIN;

CREATE TABLE IF NOT EXISTS public.point_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  previous_points smallint NOT NULL CHECK (previous_points >= 0),
  new_points smallint NOT NULL CHECK (new_points >= 0),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 10 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (previous_points <> new_points)
);

CREATE INDEX IF NOT EXISTS point_corrections_publication_idx
  ON public.point_corrections (publication_id, created_at DESC);

REVOKE ALL ON public.point_corrections FROM anon, authenticated;

COMMIT;
