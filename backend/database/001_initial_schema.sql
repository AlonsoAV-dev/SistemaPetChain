BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.user_status AS ENUM ('active', 'suspended');
CREATE TYPE public.publication_type AS ENUM ('lost_pet', 'adoption', 'responsible_action');
CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.moderation_decision AS ENUM ('approved', 'rejected');
CREATE TYPE public.lost_pet_status AS ENUM ('active', 'found', 'closed');
CREATE TYPE public.adoption_status AS ENUM ('available', 'reserved', 'adopted', 'closed');
CREATE TYPE public.point_transaction_type AS ENUM ('publication_approved', 'manual_adjustment');

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  email varchar(254) NOT NULL CHECK (email = lower(trim(email))),
  password_hash text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  status public.user_status NOT NULL DEFAULT 'active',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_unique_idx ON public.users (lower(email));

CREATE TABLE public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type public.publication_type NOT NULL,
  title varchar(160) NOT NULL CHECK (length(trim(title)) BETWEEN 4 AND 160),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 10 AND 3000),
  moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  approved_at timestamptz,
  points_awarded smallint NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
  points_processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT publications_review_state_check CHECK (
    (moderation_status = 'pending'
      AND reviewed_by IS NULL
      AND reviewed_at IS NULL
      AND rejection_reason IS NULL)
    OR
    (moderation_status = 'approved'
      AND reviewed_by IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND approved_at IS NOT NULL
      AND rejection_reason IS NULL)
    OR
    (moderation_status = 'rejected'
      AND reviewed_by IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND rejection_reason IS NOT NULL)
  )
);

CREATE INDEX publications_public_feed_idx
  ON public.publications (type, approved_at DESC)
  WHERE moderation_status = 'approved';
CREATE INDEX publications_owner_idx ON public.publications (owner_id, created_at DESC);
CREATE INDEX publications_moderation_queue_idx
  ON public.publications (created_at)
  WHERE moderation_status = 'pending';

CREATE TABLE public.lost_pet_publications (
  publication_id uuid PRIMARY KEY REFERENCES public.publications(id) ON DELETE CASCADE,
  pet_name varchar(100) NOT NULL,
  species varchar(60) NOT NULL,
  breed varchar(100),
  sex varchar(20),
  size varchar(30),
  zone varchar(160) NOT NULL,
  last_seen_at timestamptz NOT NULL,
  contact_name varchar(120) NOT NULL,
  contact_phone varchar(30),
  image_url text,
  search_status public.lost_pet_status NOT NULL DEFAULT 'active'
);

CREATE TABLE public.adoption_publications (
  publication_id uuid PRIMARY KEY REFERENCES public.publications(id) ON DELETE CASCADE,
  pet_name varchar(100) NOT NULL,
  species varchar(60) NOT NULL,
  age_label varchar(60) NOT NULL,
  breed varchar(100),
  sex varchar(20),
  vaccinated boolean NOT NULL DEFAULT false,
  sterilized boolean NOT NULL DEFAULT false,
  personality text NOT NULL CHECK (length(trim(personality)) BETWEEN 3 AND 1000),
  contact_name varchar(120) NOT NULL,
  contact_phone varchar(30),
  image_url text,
  adoption_status public.adoption_status NOT NULL DEFAULT 'available'
);

CREATE TABLE public.responsible_action_publications (
  publication_id uuid PRIMARY KEY REFERENCES public.publications(id) ON DELETE CASCADE,
  category varchar(80) NOT NULL,
  action_date date NOT NULL DEFAULT current_date,
  location varchar(180),
  evidence_url text
);

CREATE TABLE public.moderation_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  decision public.moderation_decision NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT moderation_rejection_reason_check CHECK (
    decision = 'approved' OR length(trim(reason)) >= 5
  )
);

CREATE INDEX moderation_reviews_publication_idx
  ON public.moderation_reviews (publication_id, created_at DESC);

CREATE TABLE public.publication_likes (
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (publication_id, user_id)
);

CREATE TABLE public.publication_favorites (
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (publication_id, user_id)
);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.point_rules (
  publication_type public.publication_type PRIMARY KEY,
  points smallint NOT NULL CHECK (points BETWEEN 0 AND 100),
  daily_reward_limit smallint NOT NULL DEFAULT 3 CHECK (daily_reward_limit > 0),
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.point_rules (publication_type, points, daily_reward_limit) VALUES
  ('lost_pet', 5, 3),
  ('adoption', 10, 3),
  ('responsible_action', 20, 3);

CREATE TABLE public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  publication_id uuid REFERENCES public.publications(id) ON DELETE SET NULL,
  transaction_type public.point_transaction_type NOT NULL,
  points smallint NOT NULL CHECK (points <> 0),
  description varchar(240) NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX point_transactions_publication_approval_idx
  ON public.point_transactions (publication_id)
  WHERE transaction_type = 'publication_approved';
CREATE INDEX point_transactions_user_idx
  ON public.point_transactions (user_id, created_at DESC);

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  category varchar(80) NOT NULL,
  title varchar(180) NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  image_url text,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  title varchar(180) NOT NULL,
  description text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location varchar(200) NOT NULL,
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  published boolean NOT NULL DEFAULT false,
  cancelled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE public.event_registrations (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_touch_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER publications_touch_updated_at
BEFORE UPDATE ON public.publications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.reset_publication_after_content_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description)
    AND OLD.moderation_status IN ('approved', 'rejected') THEN
    NEW.moderation_status := 'pending';
    NEW.rejection_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.approved_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER publications_reset_after_content_edit
BEFORE UPDATE ON public.publications
FOR EACH ROW EXECUTE FUNCTION public.reset_publication_after_content_edit();

CREATE TRIGGER comments_touch_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER articles_touch_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER events_touch_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.validate_publication_subtype()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  expected_type public.publication_type := TG_ARGV[0]::public.publication_type;
  actual_type public.publication_type;
BEGIN
  SELECT type INTO actual_type
  FROM public.publications
  WHERE id = NEW.publication_id;

  IF actual_type IS DISTINCT FROM expected_type THEN
    RAISE EXCEPTION 'La publicación % debe ser de tipo %', NEW.publication_id, expected_type
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER lost_pet_validate_type
BEFORE INSERT OR UPDATE ON public.lost_pet_publications
FOR EACH ROW EXECUTE FUNCTION public.validate_publication_subtype('lost_pet');

CREATE TRIGGER adoption_validate_type
BEFORE INSERT OR UPDATE ON public.adoption_publications
FOR EACH ROW EXECUTE FUNCTION public.validate_publication_subtype('adoption');

CREATE TRIGGER responsible_action_validate_type
BEFORE INSERT OR UPDATE ON public.responsible_action_publications
FOR EACH ROW EXECUTE FUNCTION public.validate_publication_subtype('responsible_action');

CREATE OR REPLACE FUNCTION public.reset_publication_to_pending()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.publications
  SET moderation_status = 'pending',
      rejection_reason = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL,
      approved_at = NULL
  WHERE id = NEW.publication_id
    AND moderation_status IN ('approved', 'rejected');

  RETURN NEW;
END;
$$;

CREATE TRIGGER lost_pet_reset_moderation
AFTER UPDATE ON public.lost_pet_publications
FOR EACH ROW EXECUTE FUNCTION public.reset_publication_to_pending();

CREATE TRIGGER adoption_reset_moderation
AFTER UPDATE ON public.adoption_publications
FOR EACH ROW EXECUTE FUNCTION public.reset_publication_to_pending();

CREATE TRIGGER responsible_action_reset_moderation
AFTER UPDATE ON public.responsible_action_publications
FOR EACH ROW EXECUTE FUNCTION public.reset_publication_to_pending();

CREATE OR REPLACE FUNCTION public.review_publication(
  target_publication_id uuid,
  reviewer_id uuid,
  new_decision public.moderation_decision,
  review_reason text DEFAULT NULL
)
RETURNS public.publications
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  publication_row public.publications;
  rule_row public.point_rules;
  rewarded_today integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = reviewer_id AND role = 'admin' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Solo un administrador activo puede moderar publicaciones'
      USING ERRCODE = '42501';
  END IF;

  IF new_decision = 'rejected'
    AND (review_reason IS NULL OR length(trim(review_reason)) < 5) THEN
    RAISE EXCEPTION 'El rechazo debe incluir un motivo de al menos 5 caracteres'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO publication_row
  FROM public.publications
  WHERE id = target_publication_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Publicación no encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF publication_row.moderation_status <> 'pending' THEN
    RAISE EXCEPTION 'Solo se pueden revisar publicaciones pendientes'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.publications
  SET moderation_status = new_decision::text::public.moderation_status,
      rejection_reason = CASE WHEN new_decision = 'rejected' THEN trim(review_reason) ELSE NULL END,
      reviewed_by = reviewer_id,
      reviewed_at = now(),
      approved_at = CASE WHEN new_decision = 'approved' THEN now() ELSE NULL END
  WHERE id = target_publication_id
  RETURNING * INTO publication_row;

  INSERT INTO public.moderation_reviews (publication_id, admin_id, decision, reason)
  VALUES (
    target_publication_id,
    reviewer_id,
    new_decision,
    CASE WHEN new_decision = 'rejected' THEN trim(review_reason) ELSE NULL END
  );

  IF new_decision = 'approved' AND publication_row.points_processed_at IS NULL THEN
    SELECT * INTO rule_row
    FROM public.point_rules
    WHERE publication_type = publication_row.type AND enabled = true;

    IF FOUND AND rule_row.points > 0 THEN
      SELECT count(*) INTO rewarded_today
      FROM public.point_transactions
      WHERE user_id = publication_row.owner_id
        AND transaction_type = 'publication_approved'
        AND created_at >= date_trunc('day', now())
        AND created_at < date_trunc('day', now()) + interval '1 day';

      IF rewarded_today < rule_row.daily_reward_limit THEN
        INSERT INTO public.point_transactions (
          user_id,
          publication_id,
          transaction_type,
          points,
          description,
          created_by
        )
        VALUES (
          publication_row.owner_id,
          publication_row.id,
          'publication_approved',
          rule_row.points,
          'Puntos por publicación aprobada',
          reviewer_id
        );

        publication_row.points_awarded := rule_row.points;
      END IF;

      UPDATE public.publications
      SET points_awarded = publication_row.points_awarded,
          points_processed_at = now()
      WHERE id = publication_row.id
      RETURNING * INTO publication_row;
    END IF;
  END IF;

  RETURN publication_row;
END;
$$;

CREATE VIEW public.admin_moderation_queue AS
SELECT
  p.id,
  p.type,
  p.title,
  p.description,
  p.created_at,
  p.moderation_status,
  p.owner_id,
  u.name AS owner_name,
  u.email AS owner_email
FROM public.publications p
JOIN public.users u ON u.id = p.owner_id
WHERE p.moderation_status = 'pending';

CREATE VIEW public.user_point_balances AS
SELECT
  u.id AS user_id,
  COALESCE(sum(pt.points), 0)::integer AS points
FROM public.users u
LEFT JOIN public.point_transactions pt ON pt.user_id = u.id
GROUP BY u.id;

-- Express es la única puerta de entrada. La Data API de Supabase no debe
-- exponer las tablas de la aplicación al navegador.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.review_publication(
  uuid,
  uuid,
  public.moderation_decision,
  text
) FROM PUBLIC, anon, authenticated;

-- Bucket público para lectura de imágenes. Las escrituras se hacen
-- exclusivamente desde Express usando SUPABASE_SECRET_KEY.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'petchain-media',
  'petchain-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;
