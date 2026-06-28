import { randomInt } from 'node:crypto';
import { query, withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import { validateText } from '../../utils/validation.js';

const limaMonthBounds = `
  SELECT
    date_trunc('month', timezone('America/Lima', now())) AS local_start
`;

async function ensureCurrentPeriod(executor = { query }) {
  await executor.query(
    `INSERT INTO public.reward_periods (name, starts_at, ends_at)
     SELECT
       'Reto mensual ' || to_char(local_start, 'YYYY-MM'),
       local_start AT TIME ZONE 'America/Lima',
       (local_start + interval '1 month') AT TIME ZONE 'America/Lima'
     FROM (${limaMonthBounds}) month_bounds
     ON CONFLICT (starts_at, ends_at) DO NOTHING`,
  );

  const result = await executor.query(
    `SELECT *
     FROM public.reward_periods
     WHERE starts_at <= now() AND ends_at > now()
     ORDER BY starts_at DESC
     LIMIT 1`,
  );
  return result.rows[0];
}

async function getRules(executor = { query }, includeLegacy = false) {
  const result = await executor.query(
    `SELECT category, min_points, max_points, monthly_reward_limit
     FROM public.responsible_action_point_rules
     WHERE enabled = true
       AND ($1::boolean = true OR available_for_submission = true)
     ORDER BY sort_order, category`,
    [includeLegacy],
  );

  return result.rows.map((row) => ({
    category: row.category,
    minPoints: row.min_points,
    maxPoints: row.max_points,
    monthlyLimit: row.monthly_reward_limit,
  }));
}

async function getRanking(executor, period) {
  const result = await executor.query(
    `SELECT
       u.id AS user_id,
       u.name,
       u.avatar_url,
       count(*)::integer AS approved_actions,
       count(DISTINCT rap.category)::integer AS distinct_categories,
       sum(p.points_awarded)::integer AS points,
       max(p.approved_at) AS reached_at
     FROM public.publications p
     JOIN public.responsible_action_publications rap ON rap.publication_id = p.id
     JOIN public.users u ON u.id = p.owner_id
     WHERE p.type = 'responsible_action'
       AND p.moderation_status = 'approved'
       AND p.points_awarded > 0
       AND p.approved_at >= $1
       AND p.approved_at < $2
       AND u.status = 'active'
     GROUP BY u.id, u.name, u.avatar_url
     ORDER BY points DESC, distinct_categories DESC, approved_actions DESC, reached_at ASC`,
    [period.starts_at, period.ends_at],
  );

  return result.rows.map((row, index) => ({
    position: index + 1,
    userId: row.user_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    points: row.points,
    approvedActions: row.approved_actions,
    distinctCategories: row.distinct_categories,
    qualified:
      row.points >= period.qualification_points &&
      row.approved_actions >= period.minimum_actions,
  }));
}

async function getHistoricalRanking(executor) {
  const result = await executor.query(
    `SELECT
       u.id AS user_id,
       u.name,
       u.avatar_url,
       count(*)::integer AS approved_actions,
       count(DISTINCT rap.category)::integer AS distinct_categories,
       sum(p.points_awarded)::integer AS points
     FROM public.publications p
     JOIN public.responsible_action_publications rap ON rap.publication_id = p.id
     JOIN public.users u ON u.id = p.owner_id
     WHERE p.type = 'responsible_action'
       AND p.moderation_status = 'approved'
       AND p.points_awarded > 0
       AND u.status = 'active'
     GROUP BY u.id, u.name, u.avatar_url
     ORDER BY points DESC, distinct_categories DESC, approved_actions DESC`,
  );

  return result.rows.map((row, index) => ({
    position: index + 1,
    userId: row.user_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    points: row.points,
    approvedActions: row.approved_actions,
    distinctCategories: row.distinct_categories,
    qualified: false,
  }));
}

function mapPeriod(row) {
  return {
    id: row.id,
    name: row.name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    qualificationPoints: row.qualification_points,
    minimumActions: row.minimum_actions,
    firstPlacePrize: row.first_place_prize,
    rafflePrize: row.raffle_prize,
    status: row.status,
    firstPlaceUserId: row.first_place_user_id,
    firstPlaceName: row.first_place_name,
    raffleWinnerUserId: row.raffle_winner_user_id,
    raffleWinnerName: row.raffle_winner_name,
    drawnAt: row.drawn_at,
  };
}

export async function getRewardsOverview(userId = null) {
  const executor = { query };
  const period = await ensureCurrentPeriod(executor);
  const [rules, ranking, historicalRanking, previous] = await Promise.all([
    getRules(executor),
    getRanking(executor, period),
    getHistoricalRanking(executor),
    query(
      `SELECT
         rp.id, rp.name, rp.starts_at, rp.ends_at, rp.qualification_points,
         rp.minimum_actions, rp.first_place_prize, rp.raffle_prize, rp.status,
         rp.first_place_user_id, first_user.name AS first_place_name,
         rp.raffle_winner_user_id, raffle_user.name AS raffle_winner_name,
         rp.drawn_at
       FROM public.reward_periods rp
       LEFT JOIN public.users first_user ON first_user.id = rp.first_place_user_id
       LEFT JOIN public.users raffle_user ON raffle_user.id = rp.raffle_winner_user_id
       WHERE rp.status = 'drawn'
       ORDER BY rp.ends_at DESC
       LIMIT 6`,
    ),
  ]);

  const currentEntry = ranking.find((item) => item.userId === userId);
  const userProgress = userId ? {
    points: currentEntry?.points ?? 0,
    approvedActions: currentEntry?.approvedActions ?? 0,
    position: currentEntry?.position ?? null,
    qualified: currentEntry?.qualified ?? false,
    pointsRemaining: Math.max(0, period.qualification_points - (currentEntry?.points ?? 0)),
    actionsRemaining: Math.max(0, period.minimum_actions - (currentEntry?.approvedActions ?? 0)),
  } : null;

  return {
    period: mapPeriod(period),
    rules,
    ranking,
    historicalRanking,
    userProgress,
    previousWinners: previous.rows.map(mapPeriod),
  };
}

export async function getAdminRewardPeriods() {
  await ensureCurrentPeriod({ query });
  const result = await query(
    `SELECT
       rp.*,
       first_user.name AS first_place_name,
       raffle_user.name AS raffle_winner_name,
       (SELECT count(DISTINCT p.owner_id)::integer
        FROM public.publications p
        JOIN public.responsible_action_publications rap ON rap.publication_id = p.id
        WHERE p.moderation_status = 'approved'
          AND p.approved_at >= rp.starts_at AND p.approved_at < rp.ends_at) AS participants
     FROM public.reward_periods rp
     LEFT JOIN public.users first_user ON first_user.id = rp.first_place_user_id
     LEFT JOIN public.users raffle_user ON raffle_user.id = rp.raffle_winner_user_id
     ORDER BY rp.starts_at DESC
     LIMIT 12`,
  );
  return result.rows.map((row) => ({ ...mapPeriod(row), participants: row.participants }));
}

export async function updateRewardPeriod(id, payload) {
  const qualificationPoints = Number(payload.qualificationPoints);
  const minimumActions = Number(payload.minimumActions);
  if (!Number.isInteger(qualificationPoints) || qualificationPoints < 1 || qualificationPoints > 500) {
    throw httpError(400, 'El puntaje de clasificacion debe estar entre 1 y 500.');
  }
  if (!Number.isInteger(minimumActions) || minimumActions < 1 || minimumActions > 20) {
    throw httpError(400, 'La cantidad minima de acciones debe estar entre 1 y 20.');
  }

  const firstPlacePrize = validateText(payload.firstPlacePrize, 'Premio del primer puesto', { min: 3, max: 240 });
  const rafflePrize = validateText(payload.rafflePrize, 'Premio del sorteo', { min: 3, max: 240 });
  const result = await query(
    `UPDATE public.reward_periods
     SET qualification_points = $2,
         minimum_actions = $3,
         first_place_prize = $4,
         raffle_prize = $5
     WHERE id = $1 AND status <> 'drawn'
     RETURNING *`,
    [id, qualificationPoints, minimumActions, firstPlacePrize, rafflePrize],
  );
  if (!result.rows[0]) throw httpError(404, 'Periodo no encontrado o ya sorteado.');
  return mapPeriod(result.rows[0]);
}

export async function drawRewardPeriod(id, adminId) {
  return withTransaction(async (client) => {
    const periodResult = await client.query(
      `SELECT * FROM public.reward_periods WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const period = periodResult.rows[0];
    if (!period) throw httpError(404, 'Periodo no encontrado.');
    if (period.status === 'drawn') throw httpError(409, 'Este periodo ya fue sorteado.');
    if (new Date(period.ends_at).getTime() > Date.now()) {
      throw httpError(409, 'El sorteo solo puede realizarse cuando finalice el periodo.');
    }

    const ranking = await getRanking(client, period);
    if (ranking.length === 0) throw httpError(409, 'No hay participantes con acciones aprobadas.');

    const firstPlace = ranking[0];
    const candidates = ranking.filter((item) => item.qualified && item.userId !== firstPlace.userId);
    if (candidates.length === 0) {
      throw httpError(409, 'No hay otro usuario clasificado para realizar el sorteo.');
    }

    const raffleWinner = candidates[randomInt(candidates.length)];
    const result = await client.query(
      `UPDATE public.reward_periods
       SET status = 'drawn',
           first_place_user_id = $2,
           raffle_winner_user_id = $3,
           drawn_by = $4,
           drawn_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, firstPlace.userId, raffleWinner.userId, adminId],
    );

    await client.query(
      `INSERT INTO public.notifications (
         recipient_id, actor_id, notification_type, title, message
       )
       VALUES
         ($1, $3, 'monthly_first_place', 'Ganaste el primer puesto', $4),
         ($2, $3, 'monthly_raffle_winner', 'Ganaste el sorteo mensual', $5)`,
      [
        firstPlace.userId,
        raffleWinner.userId,
        adminId,
        `Obtuviste el primer puesto de ${period.name}: ${period.first_place_prize}.`,
        `Fuiste seleccionado en el sorteo de ${period.name}: ${period.raffle_prize}.`,
      ],
    );

    return {
      period: mapPeriod(result.rows[0]),
      firstPlace,
      raffleWinner,
      candidateCount: candidates.length,
    };
  });
}

export { getRules };
