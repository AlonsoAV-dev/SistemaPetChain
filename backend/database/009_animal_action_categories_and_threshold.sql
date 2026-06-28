BEGIN;

ALTER TABLE public.reward_periods
  ALTER COLUMN qualification_points SET DEFAULT 15;

UPDATE public.reward_periods
SET qualification_points = 15
WHERE status = 'active';

ALTER TABLE public.responsible_action_point_rules
  ADD COLUMN IF NOT EXISTS monthly_reward_limit smallint
  CHECK (monthly_reward_limit IS NULL OR monthly_reward_limit > 0);

ALTER TABLE public.responsible_action_publications
  DISABLE TRIGGER responsible_action_reset_moderation;

UPDATE public.responsible_action_publications
SET category = CASE category
  WHEN 'Difusion educativa' THEN 'Educacion sobre bienestar animal'
  WHEN 'Educacion' THEN 'Educacion sobre bienestar animal'
  WHEN 'Donacion de alimento o materiales' THEN 'Donacion para animales'
  WHEN 'Limpieza o mejora de espacios' THEN 'Limpieza de espacios para animales'
  WHEN 'Medio ambiente' THEN 'Limpieza de espacios para animales'
  WHEN 'Voluntariado' THEN 'Voluntariado por el bienestar animal'
  WHEN 'Ayuda comunitaria' THEN 'Voluntariado por el bienestar animal'
  WHEN 'Hogar temporal' THEN 'Hogar temporal para animales'
  WHEN 'Adopcion responsable' THEN 'Adopcion responsable completada'
  WHEN 'Bienestar animal' THEN 'Cuidado cotidiano de mascotas'
  ELSE category
END;

ALTER TABLE public.responsible_action_publications
  ENABLE TRIGGER responsible_action_reset_moderation;

DELETE FROM public.responsible_action_point_rules;

INSERT INTO public.responsible_action_point_rules (
  category, min_points, max_points, monthly_reward_limit,
  available_for_submission, sort_order
)
VALUES
  ('Cuidado cotidiano de mascotas', 1, 3, 2, true, 10),
  ('Alimentacion de animales en situacion de calle', 3, 6, 3, true, 20),
  ('Educacion sobre bienestar animal', 3, 7, 2, true, 30),
  ('Donacion para animales', 5, 10, 2, true, 40),
  ('Limpieza de espacios para animales', 7, 12, 2, true, 50),
  ('Voluntariado por el bienestar animal', 10, 18, 3, true, 60),
  ('Atencion veterinaria preventiva', 10, 18, 2, true, 70),
  ('Hogar temporal para animales', 15, 22, 2, true, 80),
  ('Recuperacion de mascota perdida', 18, 25, 2, true, 90),
  ('Rescate comprobado', 20, 28, 2, true, 100),
  ('Adopcion responsable completada', 25, 30, 2, true, 110);

CREATE OR REPLACE FUNCTION public.enforce_responsible_action_monthly_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  action_category varchar(80);
  category_limit smallint;
  rewarded_this_month integer;
  month_start timestamptz;
  month_end timestamptz;
BEGIN
  IF NEW.type <> 'responsible_action'
    OR NEW.moderation_status <> 'approved'
    OR OLD.moderation_status = 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT rap.category, rule.monthly_reward_limit
  INTO action_category, category_limit
  FROM public.responsible_action_publications rap
  JOIN public.responsible_action_point_rules rule ON rule.category = rap.category
  WHERE rap.publication_id = NEW.id;

  IF category_limit IS NULL THEN
    RETURN NEW;
  END IF;

  month_start := date_trunc('month', timezone('America/Lima', now())) AT TIME ZONE 'America/Lima';
  month_end := month_start + interval '1 month';

  SELECT count(*)::integer INTO rewarded_this_month
  FROM public.publications p
  JOIN public.responsible_action_publications rap ON rap.publication_id = p.id
  WHERE p.owner_id = NEW.owner_id
    AND p.type = 'responsible_action'
    AND p.moderation_status = 'approved'
    AND rap.category = action_category
    AND p.approved_at >= month_start
    AND p.approved_at < month_end
    AND p.id <> NEW.id;

  IF rewarded_this_month >= category_limit THEN
    RAISE EXCEPTION 'El usuario alcanzo el limite mensual para esta categoria'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS publications_enforce_action_monthly_limit
  ON public.publications;
CREATE TRIGGER publications_enforce_action_monthly_limit
BEFORE UPDATE OF moderation_status ON public.publications
FOR EACH ROW EXECUTE FUNCTION public.enforce_responsible_action_monthly_limit();

REVOKE EXECUTE ON FUNCTION public.enforce_responsible_action_monthly_limit()
  FROM PUBLIC, anon, authenticated;

COMMIT;
