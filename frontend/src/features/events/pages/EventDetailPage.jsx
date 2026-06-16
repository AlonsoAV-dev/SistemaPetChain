import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import { eventsApi } from '../../../shared/api/vetchainApi.js';
import LinkPreview from '../../../shared/components/LinkPreview.jsx';

export default function EventDetailPage() {
  const { id } = useParams();
  const session = getStoredSession();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  const loadEvent = useCallback(async () => {
    setEvent(await eventsApi.get(id));
  }, [id]);

  useEffect(() => {
    loadEvent().catch((apiError) => setError(apiError.message));
  }, [loadEvent]);

  async function attend() {
    try {
      setEvent(await eventsApi.attend(id));
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  if (!event) return <div className="empty-state">{error || 'Cargando evento...'}</div>;

  return (
    <section className="detail-page">
      <Link className="back-link" to="/app/eventos"><ArrowLeft size={17} /> Volver a eventos</Link>
      {error && <p className="form-error">{error}</p>}
      <article className="detail-summary event-detail-summary">
        <span className="eyebrow">Evento PetChain</span>
        <h1>{event.title}</h1>
        <p className="detail-lead">{event.description}</p>
        <div className="spec-grid">
          <div><span>Inicio</span><strong><CalendarDays size={15} /> {new Date(event.date).toLocaleString('es-PE')}</strong></div>
          <div><span>Fin</span><strong>{event.endsAt ? new Date(event.endsAt).toLocaleString('es-PE') : 'No indicado'}</strong></div>
          <div><span>Ubicación</span><strong><MapPin size={15} /> {event.location}</strong></div>
          <div><span>Asistentes</span><strong><Users size={15} /> {event.participants}{event.capacity ? ` / ${event.capacity}` : ''}</strong></div>
          <div><span>Publicado por</span><strong>{event.creatorName}</strong></div>
        </div>
        <LinkPreview url={event.externalUrl} />
        {session?.user?.role === 'user' && (
          <button className="button button-primary detail-primary-action" disabled={event.isRegistered} type="button" onClick={attend}>
            {event.isRegistered ? 'Ya marcaste asistencia' : 'Asistiré'}
          </button>
        )}
      </article>
    </section>
  );
}
