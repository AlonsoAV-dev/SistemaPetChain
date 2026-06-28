BEGIN;

CREATE TEMP TABLE current_ranking_targets ON COMMIT DROP AS
WITH current_period AS (
  SELECT starts_at, ends_at
  FROM public.reward_periods
  WHERE starts_at <= now() AND ends_at > now()
  ORDER BY starts_at DESC
  LIMIT 1
)
SELECT
  p.owner_id AS user_id,
  (floor(random() * 15) + 6)::integer AS target_points
FROM public.publications p
JOIN public.responsible_action_publications rap ON rap.publication_id = p.id
JOIN current_period period
  ON p.approved_at >= period.starts_at AND p.approved_at < period.ends_at
WHERE p.moderation_status = 'approved'
GROUP BY p.owner_id;

CREATE TEMP TABLE current_action_scores ON COMMIT DROP AS
WITH current_period AS (
  SELECT starts_at, ends_at
  FROM public.reward_periods
  WHERE starts_at <= now() AND ends_at > now()
  ORDER BY starts_at DESC
  LIMIT 1
), ranked_actions AS (
  SELECT
    p.id AS publication_id,
    p.owner_id AS user_id,
    row_number() OVER (PARTITION BY p.owner_id ORDER BY p.approved_at, p.id) AS action_number,
    count(*) OVER (PARTITION BY p.owner_id) AS action_count
  FROM public.publications p
  JOIN public.responsible_action_publications rap ON rap.publication_id = p.id
  JOIN current_period period
    ON p.approved_at >= period.starts_at AND p.approved_at < period.ends_at
  WHERE p.moderation_status = 'approved'
)
SELECT
  action.publication_id,
  action.user_id,
  (
    target.target_points / action.action_count
    + CASE
        WHEN action.action_number <= target.target_points % action.action_count THEN 1
        ELSE 0
      END
  )::smallint AS assigned_points
FROM ranked_actions action
JOIN current_ranking_targets target ON target.user_id = action.user_id;

UPDATE public.publications publication
SET points_awarded = score.assigned_points
FROM current_action_scores score
WHERE publication.id = score.publication_id;

UPDATE public.moderation_reviews review
SET assigned_points = score.assigned_points,
    scoring_reason = COALESCE(
      review.scoring_reason,
      'Puntaje inicial normalizado para el ranking mensual.'
    )
FROM current_action_scores score
WHERE review.id = (
  SELECT latest.id
  FROM public.moderation_reviews latest
  WHERE latest.publication_id = score.publication_id
    AND latest.decision = 'approved'
  ORDER BY latest.created_at DESC
  LIMIT 1
);

WITH balances AS (
  SELECT
    target.user_id,
    target.target_points,
    COALESCE(sum(transaction.points), 0)::integer AS current_points
  FROM current_ranking_targets target
  LEFT JOIN public.point_transactions transaction ON transaction.user_id = target.user_id
  GROUP BY target.user_id, target.target_points
)
INSERT INTO public.point_transactions (
  user_id, publication_id, transaction_type, points, description, created_by
)
SELECT
  user_id,
  NULL,
  'manual_adjustment',
  target_points - current_points,
  'Sincronizacion de saldo con ranking mensual: ' || target_points,
  NULL
FROM balances
WHERE target_points <> current_points;

COMMIT;
