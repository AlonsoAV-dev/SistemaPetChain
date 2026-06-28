import { ArrowLeft, CalendarDays, MapPin, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { responsibleActionsApi } from '../../../shared/api/vetchainApi.js';
import CommentsPanel from '../../../shared/components/CommentsPanel.jsx';
import PhotoGallery from '../../../shared/components/PhotoGallery.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';
import LoadingState from '../../../shared/components/LoadingState.jsx';

export default function ActionDetailPage({ publicView = false }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [action, setAction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    responsibleActionsApi.get(id).then(setAction).catch((apiError) => setError(apiError.message));
  }, [id]);

  if (!action) return error ? <div className="empty-state">{error}</div> : <LoadingState label="Cargando acción responsable..." />;

  const fromAdmin = searchParams.get('from');
  const backLink = fromAdmin?.startsWith('admin-')
    ? { to: fromAdmin === 'admin-moderation' ? '/app/admin' : '/app/admin/publicaciones', label: 'Volver a administración' }
    : publicView
      ? { to: '/login', label: 'Ir a PetChain' }
      : { to: '/app/acciones', label: 'Volver a acciones responsables' };
  const statusLabel = action.moderationStatus === 'approved'
    ? 'Aprobado'
    : action.moderationStatus === 'rejected'
      ? 'Rechazado'
      : 'Pendiente';

  return (
    <section className="detail-page">
      <Link className="back-link" to={backLink.to}><ArrowLeft size={17} /> {backLink.label}</Link>
      <div className="detail-layout">
        <PhotoGallery images={[action.evidenceUrl].filter(Boolean)} alt={action.title} />
        <article className="detail-summary">
          <div className="card-title-row"><div><span className="eyebrow">Acción responsable</span><h1>{action.title}</h1></div><StatusBadge status={statusLabel} /></div>
          <p className="detail-lead">{action.description}</p>
          <div className="spec-grid">
            <div><span>Categoría</span><strong>{action.category}</strong></div>
            <div><span>Autor</span><strong>{action.author}</strong></div>
            <div><span>Fecha</span><strong><CalendarDays size={15} /> {new Date(action.actionDate).toLocaleDateString('es-PE')}</strong></div>
            <div><span>Ubicación</span><strong><MapPin size={15} /> {action.location || 'No indicada'}</strong></div>
            <div><span>Reconocimiento</span><strong><Trophy size={15} /> {action.moderationStatus === 'approved' ? `${action.points} puntos` : `Rango ${action.minPoints ?? '-'}–${action.maxPoints ?? '-'}`}</strong></div>
            <div><span>Apoyo comunitario</span><strong>{action.likes} me gusta</strong></div>
          </div>
          {action.scoringReason && <div className="score-detail-note"><strong>Justificación del puntaje</strong><p>{action.scoringReason}</p></div>}
          {action.rejectionReason && <p className="rejection-note">Motivo del rechazo: {action.rejectionReason}</p>}
        </article>
      </div>
      <section className="detail-section"><h2>Comentarios</h2><CommentsPanel publicationId={action.id} /></section>
    </section>
  );
}
