import { ArrowLeft, CalendarDays, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articlesApi } from '../../../shared/api/vetchainApi.js';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    articlesApi.get(id).then(setArticle).catch((apiError) => setError(apiError.message));
  }, [id]);

  if (!article) return <div className="empty-state">{error || 'Cargando artículo...'}</div>;

  const publishedDate = article.publishedAt ?? article.createdAt;
  const paragraphs = article.content.split('\n').map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <section className="detail-page article-detail-page">
      <Link className="back-link" to="/app/articulos"><ArrowLeft size={17} /> Volver a artículos</Link>

      <article className="article-detail-shell">
        <header className="article-detail-hero">
          <div className="article-detail-hero-content">
            <span className="category-pill">{article.category}</span>
            <h1>{article.title}</h1>
            <p>{article.description}</p>
            <div className="article-detail-meta">
              <span><CalendarDays size={16} /> {publishedDate ? new Date(publishedDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha'}</span>
            </div>
          </div>
          {article.image && (
            <div className="article-detail-cover">
              <img className="article-detail-cover-background" src={article.image} alt="" aria-hidden="true" />
              <img className="article-detail-cover-image" src={article.image} alt={article.title} />
            </div>
          )}
        </header>

        <div className="article-detail-body">
          <div className="article-content article-content-readable">
            {paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))}
          </div>

          {article.sources?.length > 0 && (
            <aside className="article-sources-card">
              <span className="eyebrow">Fuentes</span>
              <h2>Referencias consultadas</h2>
              <div className="article-source-list">
                {article.sources.map((source) => (
                  <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                    <span>{source.label}</span>
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </aside>
          )}
        </div>
      </article>
    </section>
  );
}
