BEGIN;

ALTER TABLE public.reward_periods
  ALTER COLUMN qualification_points SET DEFAULT 15;

UPDATE public.reward_periods
SET qualification_points = 15
WHERE status = 'active';

WITH current_balances AS (
  SELECT u.id AS user_id, COALESCE(sum(pt.points), 0)::integer AS current_points
  FROM public.users u
  JOIN public.point_transactions pt ON pt.user_id = u.id
  WHERE u.role = 'user'
  GROUP BY u.id
  HAVING COALESCE(sum(pt.points), 0) > 0
), randomized_balances AS (
  SELECT
    user_id,
    current_points,
    (floor(random() * 15) + 6)::integer AS target_points
  FROM current_balances
)
INSERT INTO public.point_transactions (
  user_id, publication_id, transaction_type, points, description, created_by
)
SELECT
  user_id,
  NULL,
  'manual_adjustment',
  target_points - current_points,
  'Ajuste inicial de puntos a ' || target_points,
  NULL
FROM randomized_balances
WHERE target_points <> current_points;

COMMIT;
