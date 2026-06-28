import { CalendarDays, Eye, MapPin, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import { eventsApi } from '../../../shared/api/vetchainApi.js';
import LinkPreview from '../../../shared/components/LinkPreview.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import LoadingState from '../../../shared/components/LoadingState.jsx';

const emptyForm = {
  title: '',
  description: '',
  date: '',
  endsAt: '',
  location: '',
  capacity: '',
  externalUrl: '',
};

export default function EventsPage() {
  const navigate = useNavigate();
  const session = getStoredSession();
  const isAdmin = session?.user?.role === 'admin';
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    setEvents(await eventsApi.list());
  }

  useEffect(() => {
    loadEvents().catch((apiError) => setError(apiError.message)).finally(() => setLoading(false));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await eventsApi.create(form);
      setForm(emptyForm);
      setFormOpen(false);
      await loadEvents();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function attend(eventId) {
    try {
      const updated = await eventsApi.attend(eventId);
      setEvents((current) => current.map((item) => item.id === eventId ? updated : item));
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  if (loading) return <LoadingState label="Cargando eventos..." />;

  return (
    <section className="module-section">
      <header className="module-header">
        <div><h1>Eventos</h1><p>Actividades comunitarias, lives y enlaces publicados por PetChain.</p></div>
        {isAdmin && <button className="button button-primary" type="button" onClick={() => { setForm(emptyForm); setFormOpen(true); }}><Plus size={18} /> Nuevo evento</button>}
      </header>
      {error && <p className="form-error">{error}</p>}
      {events.length === 0 && <div className="empty-state">No hay eventos próximos.</div>}
      <div className="records-grid">
        {events.map((item) => (
          <article className="post-card event-card clickable-card" key={item.id} role="link" tabIndex={0} onClick={() => navigate(`/app/eventos/${item.id}`)} onKeyDown={(event) => event.key === 'Enter' && navigate(`/app/eventos/${item.id}`)}>
            <div className="event-date"><CalendarDays size={22} /><strong>{new Date(item.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</strong></div>
            <div className="post-card-body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="event-meta"><span><MapPin size={15} /> {item.location}</span><span><Users size={15} /> {item.participants} asistentes{item.capacity ? ` / ${item.capacity}` : ''}</span></div>
              <LinkPreview url={item.externalUrl} />
              <div className="card-actions">
                <button className="button button-secondary" type="button" onClick={(event) => { event.stopPropagation(); navigate(`/app/eventos/${item.id}`); }}><Eye size={16} /> Ver detalle</button>
                {session?.user?.role === 'user' && (
                  <button className="button button-primary" disabled={item.isRegistered} type="button" onClick={(event) => { event.stopPropagation(); attend(item.id); }}>
                    {item.isRegistered ? 'Asistirás' : 'Asistiré'}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Publicar evento" description="Solo los administradores pueden crear eventos. El evento se publicará inmediatamente." size="lg">
        <form className="modal-form-grid" onSubmit={submit}>
          <label className="field field-full"><span>Título</span><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="field"><span>Inicio</span><input className="input" type="datetime-local" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label className="field"><span>Fin</span><input className="input" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label>
          <label className="field"><span>Ubicación</span><input className="input" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
          <label className="field"><span>Capacidad</span><input className="input" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label>
          <label className="field field-full"><span>Link TikTok, Instagram, live o formulario</span><input className="input" type="url" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://www.instagram.com/..." /></label>
          <div className="field-full"><LinkPreview url={form.externalUrl} /></div>
          <label className="field field-full"><span>Descripción</span><textarea className="textarea" required minLength={10} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="modal-actions field-full"><button className="button button-secondary" type="button" onClick={() => setFormOpen(false)}>Cancelar</button><button className="button button-primary" disabled={saving} type="submit">{saving ? 'Publicando...' : 'Publicar evento'}</button></div>
        </form>
      </Modal>
    </section>
  );
}
