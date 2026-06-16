import { ArrowLeft } from 'lucide-react';
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

  return (
    <section className="detail-page article-detail-page">
      <Link className="back-link" to="/app/articulos"><ArrowLeft size={17} /> Volver a artículos</Link>
      <article className="detail-section article-detail">
        {article.image && <img className="article-detail-image" src={article.image} alt={article.title} />}
        <span className="category-pill">{article.category}</span>
        <h1>{article.title}</h1>
        <p className="detail-lead">{article.description}</p>
        <div className="article-content">
          {article.content.split('\n').filter(Boolean).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </section>
  );
}
