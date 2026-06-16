import { query } from '../../config/database.js';

export async function getSummary(userId) {
  const result = await query(
    `SELECT
       (SELECT count(*)::integer
        FROM public.publication_favorites
        WHERE user_id = $1) AS saved_posts,
       (SELECT count(*)::integer
        FROM public.publications p
        JOIN public.lost_pet_publications lp ON lp.publication_id = p.id
        WHERE p.moderation_status = 'approved' AND lp.search_status = 'active') AS active_lost_pets,
       (SELECT count(*)::integer
        FROM public.publications p
        JOIN public.adoption_publications ap ON ap.publication_id = p.id
        WHERE p.moderation_status = 'approved' AND ap.adoption_status = 'available') AS adoption_pets,
       (SELECT count(*)::integer
        FROM public.events
        WHERE published = true AND cancelled = false AND starts_at >= now()) AS upcoming_events`,
    [userId],
  );
  const row = result.rows[0];

  return {
    savedPosts: row.saved_posts,
    activeLostPets: row.active_lost_pets,
    adoptionPets: row.adoption_pets,
    upcomingEvents: row.upcoming_events,
  };
}

export async function getActivity(userId) {
  const result = await query(
    `SELECT id, type, title, moderation_status, created_at
     FROM public.publications
     WHERE owner_id = $1
     ORDER BY created_at DESC
     LIMIT 8`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: `${row.title} (${row.moderation_status})`,
    dateLabel: row.created_at,
  }));
}

export async function getDashboard(userId) {
  const [summary, activity, articles] = await Promise.all([
    getSummary(userId),
    getActivity(userId),
    query(
      `SELECT id, category, title, description, image_url, published_at
       FROM public.articles
       WHERE published = true
       ORDER BY published_at DESC NULLS LAST
       LIMIT 3`,
    ),
  ]);

  return {
    summary,
    articles: articles.rows.map((article) => ({
      id: article.id,
      category: article.category,
      title: article.title,
      description: article.description,
      imageUrl: article.image_url,
      publishedAt: article.published_at,
    })),
    activity,
  };
}
