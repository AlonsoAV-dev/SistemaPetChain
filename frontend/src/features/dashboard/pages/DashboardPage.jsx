import { Bookmark, CalendarDays, Heart, PawPrint, Search } from 'lucide-react';
import StatCard from '../../../shared/components/StatCard.jsx';
import {
  adoptionPets,
  lostPets,
  recentActivity,
  recommendedArticles,
} from '../../../shared/data/mockData.js';

const activityIcons = {
  heart: Heart,
  bookmark: Bookmark,
  calendar: CalendarDays,
};

export default function DashboardPage() {
  return (
    <>
      <section className="page-header dashboard-hero">
        <div className="page-title">
          <h1>Bienvenida, Alonso <PawPrint size={28} aria-hidden="true" /></h1>
          <p>Gracias por ser parte de la comunidad VetChain.</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard icon={Bookmark} label="Publicaciones guardadas" value="12" tone="green" />
        <StatCard icon={Search} label="Reportes activos de perdidas" value={lostPets.length} tone="purple" />
        <StatCard icon={Heart} label="Mascotas en adopción" value={adoptionPets.length} tone="red" />
        <StatCard icon={CalendarDays} label="Eventos próximos" value="5" tone="pink" />
      </section>

      <section className="dashboard-grid dashboard-reference-grid">
        <div className="panel articles-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Artículos recomendados</h2>
            </div>
            <button className="text-button" type="button">Ver todos</button>
          </div>

          <div className="article-grid">
            {recommendedArticles.map((article) => (
              <article className="article-card" key={article.id}>
                <img src={article.image} alt={article.title} />
                <div className="article-card-body">
                  <span className="category-pill">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <button className="read-more-button" type="button">
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
            {recentActivity.map((item) => {
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

