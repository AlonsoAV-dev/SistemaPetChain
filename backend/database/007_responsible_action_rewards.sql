BEGIN;

CREATE TABLE IF NOT EXISTS public.responsible_action_point_rules (
  category varchar(80) PRIMARY KEY,
  min_points smallint NOT NULL CHECK (min_points BETWEEN 0 AND 100),
  max_points smallint NOT NULL CHECK (max_points BETWEEN min_points AND 100),
  enabled boolean NOT NULL DEFAULT true,
  available_for_submission boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.responsible_action_point_rules (
  category, min_points, max_points, available_for_submission, sort_order
)
VALUES
  ('Difusion educativa', 3, 7, true, 10),
  ('Donacion de alimento o materiales', 5, 10, true, 20),
  ('Limpieza o mejora de espacios', 7, 12, true, 30),
  ('Voluntariado', 10, 18, true, 40),
  ('Atencion veterinaria preventiva', 10, 18, true, 50),
  ('Hogar temporal', 15, 22, true, 60),
  ('Recuperacion de mascota perdida', 18, 25, true, 70),
  ('Rescate comprobado', 20, 28, true, 80),
  ('Adopcion responsable completada', 25, 30, true, 90),
  ('Bienestar animal', 5, 15, false, 200),
  ('Medio ambiente', 7, 12, false, 210),
  ('Ayuda comunitaria', 8, 18, false, 220),
  ('Adopcion responsable', 20, 30, false, 230),
  ('Educacion', 3, 7, false, 240)
ON CONFLICT (category) DO UPDATE
SET min_points = EXCLUDED.min_points,
    max_points = EXCLUDED.max_points,
    available_for_submission = EXCLUDED.available_for_submission,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

ALTER TABLE public.moderation_reviews
  ADD COLUMN IF NOT EXISTS assigned_points smallint,
  ADD COLUMN IF NOT EXISTS scoring_reason text;

ALTER TABLE public.moderation_reviews
  DROP CONSTRAINT IF EXISTS moderation_assigned_points_check;
ALTER TABLE public.moderation_reviews
  ADD CONSTRAINT moderation_assigned_points_check
  CHECK (assigned_points IS NULL OR assigned_points BETWEEN 0 AND 100);

CREATE TABLE IF NOT EXISTS public.reward_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  qualification_points smallint NOT NULL DEFAULT 15 CHECK (qualification_points > 0),
  minimum_actions smallint NOT NULL DEFAULT 2 CHECK (minimum_actions > 0),
  first_place_prize varchar(240) NOT NULL DEFAULT 'Premio por definir',
  raffle_prize varchar(240) NOT NULL DEFAULT 'Premio por definir',
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'drawn')),
  first_place_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  raffle_winner_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  drawn_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  drawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  UNIQUE (starts_at, ends_at)
);

CREATE INDEX IF NOT EXISTS reward_periods_dates_idx
  ON public.reward_periods (starts_at DESC, ends_at DESC);

INSERT INTO public.reward_periods (name, starts_at, ends_at)
SELECT
  'Reto mensual ' || to_char(month_start, 'YYYY-MM'),
  month_start AT TIME ZONE 'America/Lima',
  (month_start + interval '1 month') AT TIME ZONE 'America/Lima'
FROM (
  SELECT date_trunc('month', timezone('America/Lima', now())) AS month_start
) current_month
ON CONFLICT (starts_at, ends_at) DO NOTHING;

DROP INDEX IF EXISTS public.point_transactions_publication_approval_idx;
CREATE INDEX IF NOT EXISTS point_transactions_publication_idx
  ON public.point_transactions (publication_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.reset_publication_after_content_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description)
    AND OLD.moderation_status IN ('approved', 'rejected') THEN
    IF OLD.moderation_status = 'approved' AND OLD.points_awarded > 0 THEN
      INSERT INTO public.point_transactions (
        user_id, publication_id, transaction_type, points, description, created_by
      )
      VALUES (
        OLD.owner_id, OLD.id, 'manual_adjustment', -OLD.points_awarded,
        'Puntos revocados por edicion de la publicacion', NULL
      );
    END IF;

    NEW.moderation_status := 'pending';
    NEW.rejection_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.approved_at := NULL;
    NEW.points_awarded := 0;
    NEW.points_processed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_publication_to_pending()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  publication_row public.publications;
BEGIN
  SELECT * INTO publication_row
  FROM public.publications
  WHERE id = NEW.publication_id
  FOR UPDATE;

  IF publication_row.moderation_status IN ('approved', 'rejected') THEN
    IF publication_row.moderation_status = 'approved' AND publication_row.points_awarded > 0 THEN
      INSERT INTO public.point_transactions (
        user_id, publication_id, transaction_type, points, description, created_by
      )
      VALUES (
        publication_row.owner_id, publication_row.id, 'manual_adjustment',
        -publication_row.points_awarded,
        'Puntos revocados por edicion de la publicacion', NULL
      );
    END IF;

    UPDATE public.publications
    SET moderation_status = 'pending',
        rejection_reason = NULL,
        reviewed_by = NULL,
        reviewed_at = NULL,
        approved_at = NULL,
        points_awarded = 0,
        points_processed_at = NULL
    WHERE id = publication_row.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_publication_points_before_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.moderation_status = 'approved'
    AND OLD.points_awarded > 0
    AND EXISTS (SELECT 1 FROM public.users WHERE id = OLD.owner_id) THEN
    INSERT INTO public.point_transactions (
      user_id, publication_id, transaction_type, points, description, created_by
    )
    VALUES (
      OLD.owner_id, OLD.id, 'manual_adjustment', -OLD.points_awarded,
      'Puntos revocados por eliminacion de la publicacion', NULL
    );
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS publications_revoke_points_before_delete ON public.publications;
CREATE TRIGGER publications_revoke_points_before_delete
BEFORE DELETE ON public.publications
FOR EACH ROW EXECUTE FUNCTION public.revoke_publication_points_before_delete();

DROP FUNCTION IF EXISTS public.review_publication(
  uuid, uuid, public.moderation_decision, text
);

CREATE OR REPLACE FUNCTION public.review_publication(
  target_publication_id uuid,
  reviewer_id uuid,
  new_decision public.moderation_decision,
  review_reason text DEFAULT NULL,
  assigned_points smallint DEFAULT NULL,
  point_reason text DEFAULT NULL
)
RETURNS public.publications
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  publication_row public.publications;
  rule_row public.point_rules;
  action_rule public.responsible_action_point_rules;
  period_row public.reward_periods;
  action_category varchar(80);
  points_to_award smallint := 0;
  rewarded_today integer := 0;
  monthly_points integer := 0;
  monthly_actions integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
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
    RAISE EXCEPTION 'Publicacion no encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF publication_row.moderation_status <> 'pending' THEN
    RAISE EXCEPTION 'Solo se pueden revisar publicaciones pendientes'
      USING ERRCODE = '22023';
  END IF;

  IF publication_row.type = 'responsible_action' AND publication_row.owner_id = reviewer_id THEN
    RAISE EXCEPTION 'Otro administrador debe evaluar tu propia accion responsable'
      USING ERRCODE = '42501';
  END IF;

  IF new_decision = 'approved' AND publication_row.type = 'responsible_action' THEN
    SELECT rap.category INTO action_category
    FROM public.responsible_action_publications rap
    WHERE rap.publication_id = publication_row.id;

    SELECT * INTO action_rule
    FROM public.responsible_action_point_rules
    WHERE category = action_category AND enabled = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'La categoria no tiene un rango de puntos configurado'
        USING ERRCODE = '22023';
    END IF;

    IF assigned_points IS NULL
      OR assigned_points < action_rule.min_points
      OR assigned_points > action_rule.max_points THEN
      RAISE EXCEPTION 'Los puntos deben estar dentro del rango configurado'
        USING ERRCODE = '22023';
    END IF;

    IF point_reason IS NULL OR length(trim(point_reason)) < 10 THEN
      RAISE EXCEPTION 'La asignacion de puntos requiere una justificacion de al menos 10 caracteres'
        USING ERRCODE = '22023';
    END IF;

    points_to_award := assigned_points;
  ELSIF new_decision = 'approved' THEN
    SELECT * INTO rule_row
    FROM public.point_rules
    WHERE publication_type = publication_row.type AND enabled = true;

    IF FOUND THEN
      SELECT count(*) INTO rewarded_today
      FROM public.point_transactions
      WHERE user_id = publication_row.owner_id
        AND transaction_type = 'publication_approved'
        AND created_at >= date_trunc('day', now())
        AND created_at < date_trunc('day', now()) + interval '1 day';

      IF rewarded_today < rule_row.daily_reward_limit THEN
        points_to_award := rule_row.points;
      END IF;
    END IF;
  END IF;

  UPDATE public.publications
  SET moderation_status = new_decision::text::public.moderation_status,
      rejection_reason = CASE WHEN new_decision = 'rejected' THEN trim(review_reason) ELSE NULL END,
      reviewed_by = reviewer_id,
      reviewed_at = now(),
      approved_at = CASE WHEN new_decision = 'approved' THEN now() ELSE NULL END,
      points_awarded = CASE WHEN new_decision = 'approved' THEN points_to_award ELSE 0 END,
      points_processed_at = CASE WHEN new_decision = 'approved' THEN now() ELSE NULL END
  WHERE id = target_publication_id
  RETURNING * INTO publication_row;

  INSERT INTO public.moderation_reviews (
    publication_id, admin_id, decision, reason, assigned_points, scoring_reason
  )
  VALUES (
    target_publication_id,
    reviewer_id,
    new_decision,
    CASE WHEN new_decision = 'rejected' THEN trim(review_reason) ELSE NULL END,
    CASE WHEN new_decision = 'approved' AND publication_row.type = 'responsible_action'
      THEN points_to_award ELSE NULL END,
    CASE WHEN new_decision = 'approved' AND publication_row.type = 'responsible_action'
      THEN trim(point_reason) ELSE NULL END
  );

  IF new_decision = 'approved' AND points_to_award > 0 THEN
    INSERT INTO public.point_transactions (
      user_id, publication_id, transaction_type, points, description, created_by
    )
    VALUES (
      publication_row.owner_id,
      publication_row.id,
      'publication_approved',
      points_to_award,
      CASE WHEN publication_row.type = 'responsible_action'
        THEN 'Puntos asignados por accion responsable'
        ELSE 'Puntos por publicacion aprobada' END,
      reviewer_id
    );
  END IF;

  INSERT INTO public.notifications (
    recipient_id, actor_id, publication_id, notification_type, title, message
  )
  VALUES (
    publication_row.owner_id,
    reviewer_id,
    publication_row.id,
    CASE WHEN new_decision = 'approved' THEN 'publication_approved' ELSE 'publication_rejected' END,
    CASE WHEN new_decision = 'approved' THEN 'Publicacion aprobada' ELSE 'Publicacion rechazada' END,
    CASE
      WHEN new_decision = 'approved' AND publication_row.type = 'responsible_action'
        THEN 'Tu accion fue aprobada con ' || points_to_award || ' puntos. ' || trim(point_reason)
      WHEN new_decision = 'approved' THEN 'Tu publicacion fue aprobada.'
      ELSE 'Tu publicacion fue rechazada: ' || trim(review_reason)
    END
  );

  IF new_decision = 'approved' AND publication_row.type = 'responsible_action' THEN
    SELECT * INTO period_row
    FROM public.reward_periods
    WHERE starts_at <= now() AND ends_at > now()
    ORDER BY starts_at DESC
    LIMIT 1;

    IF FOUND THEN
      SELECT count(*)::integer, COALESCE(sum(p.points_awarded), 0)::integer
      INTO monthly_actions, monthly_points
      FROM public.publications p
      WHERE p.owner_id = publication_row.owner_id
        AND p.type = 'responsible_action'
        AND p.moderation_status = 'approved'
        AND p.approved_at >= period_row.starts_at
        AND p.approved_at < period_row.ends_at;

      IF monthly_points >= period_row.qualification_points
        AND monthly_actions >= period_row.minimum_actions
        AND NOT EXISTS (
          SELECT 1 FROM public.notifications n
          WHERE n.recipient_id = publication_row.owner_id
            AND n.notification_type = 'raffle_qualified'
            AND n.created_at >= period_row.starts_at
            AND n.created_at < period_row.ends_at
        ) THEN
        INSERT INTO public.notifications (
          recipient_id, actor_id, notification_type, title, message
        )
        VALUES (
          publication_row.owner_id,
          reviewer_id,
          'raffle_qualified',
          'Clasificaste al sorteo mensual',
          'Alcanzaste los requisitos de ' || period_row.name || '.'
        );
      END IF;
    END IF;
  END IF;

  RETURN publication_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_publication(
  uuid, uuid, public.moderation_decision, text, smallint, text
) FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS responsible_action_point_rules_touch_updated_at
  ON public.responsible_action_point_rules;
CREATE TRIGGER responsible_action_point_rules_touch_updated_at
BEFORE UPDATE ON public.responsible_action_point_rules
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS reward_periods_touch_updated_at ON public.reward_periods;
CREATE TRIGGER reward_periods_touch_updated_at
BEFORE UPDATE ON public.reward_periods
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

REVOKE ALL ON public.responsible_action_point_rules FROM anon, authenticated;
REVOKE ALL ON public.reward_periods FROM anon, authenticated;

COMMIT;
