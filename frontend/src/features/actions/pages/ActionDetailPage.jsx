import { ArrowLeft, CalendarDays, MapPin, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { responsibleActionsApi } from '../../../shared/api/vetchainApi.js';
import CommentsPanel from '../../../shared/components/CommentsPanel.jsx';
import PhotoGallery from '../../../shared/components/PhotoGallery.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

export default function ActionDetailPage() {
  const { id } = useParams();
  const [action, setAction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    responsibleActionsApi.get(id).then(setAction).catch((apiError) => setError(apiError.message));
  }, [id]);

  if (!action) return <div className="empty-state">{error || 'Cargando publicación...'}</div>;

  return (
    <section className="detail-page">
      <Link className="back-link" to="/app/acciones"><ArrowLeft size={17} /> Volver a acciones responsables</Link>
      <div className="detail-layout">
        <PhotoGallery images={[action.evidenceUrl].filter(Boolean)} alt={action.title} />
        <article className="detail-summary">
          <div className="card-title-row"><div><span className="eyebrow">Acción responsable</span><h1>{action.title}</h1></div><StatusBadge status="Aprobado" /></div>
          <p className="detail-lead">{action.description}</p>
          <div className="spec-grid">
            <div><span>Categoría</span><strong>{action.category}</strong></div>
            <div><span>Autor</span><strong>{action.author}</strong></div>
            <div><span>Fecha</span><strong><CalendarDays size={15} /> {new Date(action.actionDate).toLocaleDateString('es-PE')}</strong></div>
            <div><span>Ubicación</span><strong><MapPin size={15} /> {action.location || 'No indicada'}</strong></div>
            <div><span>Reconocimiento</span><strong><Trophy size={15} /> {action.points} puntos</strong></div>
            <div><span>Apoyo comunitario</span><strong>{action.likes} me gusta</strong></div>
          </div>
        </article>
      </div>
      <section className="detail-section"><h2>Comentarios</h2><CommentsPanel publicationId={action.id} /></section>
    </section>
  );
}
