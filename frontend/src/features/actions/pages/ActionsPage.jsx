import { Edit3, Eye, Heart, MessageCircle, Plus, Search, Trash2, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import { mediaApi, responsibleActionsApi } from '../../../shared/api/vetchainApi.js';
import CommentsPanel from '../../../shared/components/CommentsPanel.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

const emptyForm = {
  title: '',
  category: 'Bienestar animal',
  description: '',
  actionDate: new Date().toISOString().slice(0, 10),
  location: '',
  evidenceUrl: '',
};

export default function ActionsPage() {
  const session = getStoredSession();
  const navigate = useNavigate();
  const canPublish = Boolean(session?.user);
  const [tab, setTab] = useState('public');
  const [actions, setActions] = useState([]);
  const [myActions, setMyActions] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [commentsFor, setCommentsFor] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const requests = [responsibleActionsApi.list()];
    if (canPublish) requests.push(responsibleActionsApi.mine());
    const [publicResult, mineResult] = await Promise.all(requests);
    setActions(publicResult);
    if (mineResult) setMyActions(mineResult);
  }, [canPublish]);

  useEffect(() => {
    loadData().catch((apiError) => setError(apiError.message));
  }, [loadData]);

  const visibleActions = tab === 'mine' ? myActions : actions;
  const filteredActions = useMemo(
    () => visibleActions.filter((action) =>
      `${action.title} ${action.category} ${action.author}`.toLowerCase().includes(query.toLowerCase())),
    [visibleActions, query],
  );

  function openCreate() {
    setEditing(null);
    setImageFile(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(action) {
    setEditing(action);
    setImageFile(null);
    setForm({
      title: action.title,
      category: action.category,
      description: action.description,
      actionDate: action.actionDate?.slice(0, 10) ?? emptyForm.actionDate,
      location: action.location ?? '',
      evidenceUrl: action.evidenceUrl ?? '',
    });
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const evidenceUrl = imageFile
        ? (await mediaApi.uploadImage(imageFile, 'evidence')).url
        : form.evidenceUrl;
      const payload = { ...form, evidenceUrl };
      if (editing) await responsibleActionsApi.update(editing.id, payload);
      else await responsibleActionsApi.create(payload);
      await loadData();
      setTab('mine');
      setFormOpen(false);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function addLike(id) {
    try {
      const updated = await responsibleActionsApi.like(id);
      setActions((current) => current.map((action) => action.id === id ? updated : action));
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function removeAction(id) {
    if (!window.confirm('¿Eliminar esta acción?')) return;
    try {
      await responsibleActionsApi.remove(id);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  return (
    <section className="module-section">
      <header className="module-header">
        <div><h1>Acciones responsables</h1><p>Comparte acciones comunitarias verificadas y suma puntos después de su aprobación.</p></div>
        {canPublish && <button className="button button-primary" type="button" onClick={openCreate}><Plus size={18} /> Nueva acción</button>}
      </header>
      <div className="module-toolbar">
        <div className="segmented-tabs">
          <button className={tab === 'public' ? 'active' : ''} type="button" onClick={() => setTab('public')}>Publicadas</button>
          {canPublish && <button className={tab === 'mine' ? 'active' : ''} type="button" onClick={() => setTab('mine')}>Mis acciones</button>}
        </div>
        <label className="search-box module-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar acciones o voluntarios" /></label>
      </div>
      {error && <p className="form-error">{error}</p>}
      {filteredActions.length === 0 && <div className="empty-state">No hay acciones para mostrar.</div>}
      <div className="records-grid">
        {filteredActions.map((action) => (
          <article className="post-card clickable-card" key={action.id} role="link" tabIndex={0} onClick={() => navigate(`/app/acciones/${action.id}`)} onKeyDown={(event) => event.key === 'Enter' && navigate(`/app/acciones/${action.id}`)}>
            <div className="pet-media action" style={action.evidenceUrl ? { backgroundImage: `linear-gradient(rgba(24,38,31,.45), rgba(24,38,31,.45)), url(${action.evidenceUrl})`, backgroundSize: 'cover' } : undefined}>
              <span className="status-badge success"><Trophy size={14} />+{action.points} pts</span>
              <span className="meta-pill">{action.category}</span>
            </div>
            <div className="post-card-body">
              <div className="card-title-row"><h3>{action.title}</h3>{tab === 'mine' && <StatusBadge status={action.moderationStatus === 'approved' ? 'Aprobado' : action.moderationStatus === 'rejected' ? 'Rechazado' : 'Pendiente'} />}</div>
              <p>{action.description}</p>
              {action.location && <span className="muted-copy">{action.location}</span>}
              {action.rejectionReason && <p className="rejection-note">Motivo: {action.rejectionReason}</p>}
              <div className="card-actions card-actions-spread">
                <span>{action.author}</span>
                {tab === 'public' ? <div className="inline-actions">
                  <button className="button button-secondary" type="button" onClick={(event) => { event.stopPropagation(); navigate(`/app/acciones/${action.id}`); }}><Eye size={16} /> Ver</button>
                  <button className="button button-secondary" type="button" onClick={(event) => { event.stopPropagation(); addLike(action.id); }}><Heart size={16} /> {action.likes}</button>
                  <button className="button button-secondary" type="button" onClick={(event) => { event.stopPropagation(); setCommentsFor(action); }}><MessageCircle size={16} /> Comentar</button>
                </div> : <div className="inline-actions">
                  <button className="button button-secondary" type="button" onClick={(event) => { event.stopPropagation(); navigate(`/app/acciones/${action.id}`); }}><Eye size={16} /> Ver</button>
                  <button className="button button-secondary" type="button" onClick={(event) => { event.stopPropagation(); openEdit(action); }}><Edit3 size={16} /> Editar</button>
                  <button className="button button-danger" type="button" onClick={(event) => { event.stopPropagation(); removeAction(action.id); }}><Trash2 size={16} /> Eliminar</button>
                </div>}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar acción responsable' : 'Nueva acción responsable'} description={session?.user?.role === 'admin' ? 'Como administrador, esta publicación aparecerá inmediatamente y no genera puntos.' : 'Los puntos se entregan únicamente cuando el administrador aprueba la publicación.'} size="lg">
        <form className="modal-form-grid" onSubmit={submit}>
          <label className="field field-full"><span>Título</span><input className="input" required minLength={4} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="field"><span>Categoría</span><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Bienestar animal</option><option>Medio ambiente</option><option>Ayuda comunitaria</option><option>Adopción responsable</option><option>Educación</option></select></label>
          <label className="field"><span>Fecha</span><input className="input" type="date" required value={form.actionDate} onChange={(e) => setForm({ ...form, actionDate: e.target.value })} /></label>
          <label className="field field-full"><span>Ubicación</span><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
          <label className="field field-full"><span>Descripción</span><textarea className="textarea" required minLength={10} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="field field-full"><span>Evidencia fotográfica</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} /></label>
          <div className="modal-actions field-full"><button className="button button-secondary" type="button" onClick={() => setFormOpen(false)}>Cancelar</button><button className="button button-primary" disabled={saving} type="submit">{saving ? 'Guardando...' : editing ? 'Guardar cambios' : session?.user?.role === 'admin' ? 'Publicar ahora' : 'Enviar a revisión'}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(commentsFor)} onClose={() => setCommentsFor(null)} title={`Comentarios sobre ${commentsFor?.title ?? ''}`} size="lg">
        {commentsFor && <CommentsPanel publicationId={commentsFor.id} />}
      </Modal>
    </section>
  );
}
