import { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, CalendarDays, Heart, PawPrint, PlusCircle, Search, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi, dashboardApi } from '../../../shared/api/vetchainApi.js';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import StatCard from '../../../shared/components/StatCard.jsx';

const activityIcons = {
  heart: Heart,
  bookmark: Bookmark,
  calendar: CalendarDays,
};

const quickActions = [
  {
    title: 'Ver adopciones',
    description: 'Conoce mascotas listas para una familia responsable.',
    icon: Heart,
    to: '/app/adopciones',
  },
  {
    title: 'Reportar mascota perdida',
    description: 'Publica datos, fotos y ubicación para activar la ayuda.',
    icon: Search,
    to: '/app/mascotas-perdidas',
  },
  {
    title: 'Publicar acción responsable',
    description: 'Comparte rescates, campañas o ayuda comunitaria.',
    icon: Trophy,
    to: '/app/acciones',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    user: getStoredSession()?.user ?? null,
    summary: {
      savedPosts: 0,
      activeLostPets: 0,
      adoptionPets: 0,
      upcomingEvents: 0,
    },
    articles: [],
    activity: [],
  });

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = dashboardApi.getDashboard();
    const loadProfile = authApi.me();

    Promise.allSettled([loadDashboard, loadProfile]).then((results) => {
      if (!isMounted) return;

      const [dashboardResult, profileResult] = results;

      if (dashboardResult.status === 'fulfilled') {
        setDashboard((current) => ({
          ...current,
          summary: dashboardResult.value.summary,
          articles: dashboardResult.value.articles,
          activity: dashboardResult.value.activity,
        }));
      } else {
        console.warn('No se pudo cargar el dashboard desde el backend:', dashboardResult.reason?.message);
      }

      if (profileResult.status === 'fulfilled') {
        setDashboard((current) => ({ ...current, user: profileResult.value }));
      } else {
        console.warn('No se pudo cargar el perfil del usuario:', profileResult.reason?.message);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const goToArticle = (article) => navigate(`/app/articulos/${article.id}`);

  return (
    <>
      <section className="page-header dashboard-hero">
        <div className="page-title">
          <h1>
            {dashboard.user?.name ? `Bienvenida, ${dashboard.user.name}` : 'Bienvenida'}{' '}
            <PawPrint size={28} aria-hidden="true" />
          </h1>
          <p>Ayuda a encontrar, adoptar y cuidar mascotas desde un solo lugar.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => navigate('/app/acciones')}>
          <PlusCircle size={18} /> Nueva acción
        </button>
      </section>

      <section className="quick-actions-grid" aria-label="Acciones principales">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <button className="quick-action-card" key={action.to} type="button" onClick={() => navigate(action.to)}>
              <span className="quick-action-icon"><Icon size={22} aria-hidden="true" /></span>
              <span>
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          );
        })}
      </section>

      <section className="stats-grid">
        <StatCard icon={Bookmark} label="Publicaciones guardadas" value={dashboard.summary.savedPosts} tone="green" />
        <StatCard icon={Search} label="Reportes activos de perdidas" value={dashboard.summary.activeLostPets} tone="purple" />
        <StatCard icon={Heart} label="Mascotas en adopción" value={dashboard.summary.adoptionPets} tone="red" />
        <StatCard icon={CalendarDays} label="Eventos próximos" value={dashboard.summary.upcomingEvents} tone="pink" />
      </section>

      <section className="dashboard-grid dashboard-reference-grid">
        <div className="panel articles-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Artículos recomendados</h2>
            </div>
            <button className="text-button" type="button" onClick={() => navigate('/app/articulos')}>Ver todos</button>
          </div>

          <div className="article-grid">
            {dashboard.articles.map((article) => (
              <article
                className="article-card clickable-card"
                key={article.id}
                role="link"
                tabIndex={0}
                onClick={() => goToArticle(article)}
                onKeyDown={(event) => event.key === 'Enter' && goToArticle(article)}
              >
                <img src={article.image} alt={article.title} />
                <div className="article-card-body">
                  <span className="category-pill">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <button
                    className="read-more-button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      goToArticle(article);
                    }}
                  >
                    Leer más
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel activity-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Actividad reciente</h2>
            </div>
          </div>

          <div className="activity-list reference-activity-list">
            {dashboard.activity.map((item) => {
              const Icon = activityIcons[item.icon] ?? Heart;

              return (
                <div className="activity-item" key={item.id}>
                  <span className={`activity-icon activity-icon-${item.icon}`}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>
    </>
  );
}
