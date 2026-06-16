import { BookOpen, HeartPulse, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesApi } from '../../../shared/api/vetchainApi.js';

const tabs = [
  {
    key: 'Educación',
    label: 'Educación',
    icon: BookOpen,
    description: 'Recursos para una tenencia responsable y mejor convivencia.',
  },
  {
    key: 'Salud',
    label: 'Salud y prevención',
    icon: HeartPulse,
    description: 'Contenido publicado para cuidar la salud de tus mascotas.',
  },
];

export default function ArticlesPage({ initialCategory = 'Educación' }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setError('');
    articlesApi
      .list(activeCategory === 'Salud' ? 'Salud' : '')
      .then(setArticles)
      .catch((apiError) => setError(apiError.message));
  }, [activeCategory]);

  const activeTab = tabs.find((tab) => tab.key === activeCategory) ?? tabs[0];
  const Icon = activeTab.icon;
  const filtered = useMemo(
    () => articles.filter((article) =>
      `${article.title} ${article.category} ${article.description}`.toLowerCase().includes(query.toLowerCase())),
    [articles, query],
  );

  return (
    <section className="module-section">
      <header className="module-header">
        <div>
          <h1>Artículos</h1>
          <p>{activeTab.description}</p>
        </div>
      </header>

      <div className="module-toolbar">
        <div className="segmented-tabs">
          {tabs.map((tab) => (
            <button
              className={activeCategory === tab.key ? 'active' : ''}
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="search-box module-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artículos o noticias" />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      {filtered.length === 0 && <div className="empty-state">No hay artículos publicados en esta categoría.</div>}
      <div className="article-grid content-library">
        {filtered.map((article) => (
          <article
            className="article-card clickable-card"
            key={article.id}
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/app/articulos/${article.id}`)}
            onKeyDown={(event) => event.key === 'Enter' && navigate(`/app/articulos/${article.id}`)}
          >
            {article.image ? <img src={article.image} alt={article.title} /> : <div className="article-placeholder"><Icon size={38} /></div>}
            <div className="article-card-body"><span className="category-pill">{article.category}</span><h3>{article.title}</h3><p>{article.description}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
