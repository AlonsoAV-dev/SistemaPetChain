import { ArrowLeft, Camera, Edit3, MapPin, Phone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import { interactionsApi, lostPetsApi, mediaApi } from '../../../shared/api/vetchainApi.js';
import CommentsPanel from '../../../shared/components/CommentsPanel.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import PhotoGallery from '../../../shared/components/PhotoGallery.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

const emptyReport = {
  reportType: 'sighting',
  location: '',
  seenAt: '',
  description: '',
  contactName: '',
  contactPhone: '',
};

const emptyEditForm = {
  name: '',
  type: 'Perro',
  breed: '',
  sex: '',
  size: '',
  zone: '',
  lastSeen: '',
  description: '',
  contactName: '',
  contactPhone: '',
  status: 'active',
};

export default function LostPetDetailPage({ publicView = false }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getStoredSession();
  const [pet, setPet] = useState(null);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(() => ({
    ...emptyReport,
    contactName: session?.user?.name ?? '',
  }));
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const item = await lostPetsApi.get(id);
    setPet(item);
    if (item.ownerId === session?.user?.id || session?.user?.role === 'admin') {
      setReports(await interactionsApi.listLostPetReports(id));
    }
  }, [id, session?.user?.id, session?.user?.role]);

  useEffect(() => {
    load().catch((apiError) => setError(apiError.message));
  }, [load]);

  async function submitReport(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const evidenceUrls = await Promise.all(
        evidenceFiles.map(async (file) => (await mediaApi.uploadImage(file, 'evidence')).url),
      );
      await interactionsApi.createLostPetReport(id, { ...form, evidenceUrls });
      setModalOpen(false);
      setMessage('Reporte enviado con las fotografías. La persona responsable ya fue notificada.');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateReport(reportId, status) {
    try {
      await interactionsApi.updateLostPetReport(reportId, status);
      await load();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  if (!pet) return <div className="empty-state">{error || 'Cargando publicación...'}</div>;

  function openEdit() {
    setEditImageFiles([]);
    setEditForm({
      name: pet.name,
      type: pet.type,
      breed: pet.breed ?? '',
      sex: pet.sex ?? '',
      size: pet.size ?? '',
      zone: pet.zone,
      lastSeen: pet.lastSeen ? new Date(pet.lastSeen).toISOString().slice(0, 16) : '',
      description: pet.description,
      contactName: pet.contact ?? '',
      contactPhone: pet.contactPhone ?? '',
      status: pet.status === 'Encontrado' ? 'found' : pet.status === 'Cerrado' ? 'closed' : 'active',
    });
    setEditOpen(true);
  }

  async function submitEdit(event) {
    event.preventDefault();
    setEditing(true);
    setError('');
    setMessage('');

    try {
      const uploaded = await Promise.all(
        editImageFiles.map(async (file) => (await mediaApi.uploadImage(file, 'publications')).url),
      );
      const imageUrls = uploaded.length ? uploaded : pet.images ?? [];
      const updated = await lostPetsApi.update(pet.id, { ...editForm, imageUrls });
      setPet(updated);
      setEditOpen(false);
      setMessage('Publicacion actualizada. Si estaba aprobada, volvera a revision antes de mostrarse publicamente.');
      await load();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setEditing(false);
    }
  }

  const isOwner = pet.ownerId === session?.user?.id;
  const canManage = isOwner || session?.user?.role === 'admin';
  const active = pet.status === 'Activo';
  const fromAdmin = searchParams.get('from');
  const backLink = fromAdmin?.startsWith('admin-')
    ? { to: fromAdmin === 'admin-moderation' ? '/app/admin' : '/app/admin/publicaciones', label: 'Volver a administración' }
    : publicView
      ? { to: '/login', label: 'Ir a PetChain' }
      : { to: '/app/mascotas-perdidas', label: 'Volver a mascotas perdidas' };

  function requireLogin(action) {
    if (session?.user) {
      action();
      return;
    }

    navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
  }

  return (
    <section className="detail-page">
      <Link className="back-link" to={backLink.to}><ArrowLeft size={17} /> {backLink.label}</Link>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <div className="detail-layout">
        <PhotoGallery images={pet.images} alt={pet.name} />
        <article className="detail-summary">
          <div className="card-title-row">
            <div><span className="eyebrow">Mascota perdida</span><h1>{pet.name}</h1></div>
            <StatusBadge status={pet.status} />
          </div>
          <p className="detail-lead">{pet.description}</p>
          <div className="spec-grid">
            <div><span>Especie</span><strong>{pet.type}</strong></div>
            <div><span>Raza</span><strong>{pet.breed || 'No especificada'}</strong></div>
            <div><span>Sexo</span><strong>{pet.sex || 'No especificado'}</strong></div>
            <div><span>Tamaño</span><strong>{pet.size || 'No especificado'}</strong></div>
            <div><span>Última zona</span><strong>{pet.zone}</strong></div>
            <div><span>Última vez visto</span><strong>{new Date(pet.lastSeen).toLocaleString('es-PE')}</strong></div>
          </div>
          <div className="contact-card">
            <strong>{pet.contact}</strong>
            <span><Phone size={16} /> {pet.contactPhone}</span>
            <small>Responsable: {pet.ownerName}</small>
          </div>
          {isOwner && (
            <button className="button button-secondary detail-primary-action" type="button" onClick={openEdit}>
              <Edit3 size={18} /> Editar publicacion
            </button>
          )}
          {!isOwner && active && (
            <button className="button button-primary detail-primary-action" type="button" onClick={() => requireLogin(() => setModalOpen(true))}>
              <MapPin size={18} /> {session?.user ? 'La vi o la encontré' : 'Inicia sesión para reportar'}
            </button>
          )}
        </article>
      </div>

      {canManage && (
        <section className="detail-section">
          <h2>Avistamientos y reportes recibidos</h2>
          {reports.length === 0 ? <div className="empty-state">Todavía no hay reportes.</div> : (
            <div className="request-list">
              {reports.map((report) => (
                <article className="request-card" key={report.id}>
                  <div className="card-title-row">
                    <strong>{report.reportType === 'found' ? 'Indica que encontró a la mascota' : 'Reportó un avistamiento'}</strong>
                    <StatusBadge status={report.status} />
                  </div>
                  <p><MapPin size={15} /> {report.location} · {new Date(report.seenAt).toLocaleString('es-PE')}</p>
                  <p>{report.description}</p>
                  <div className="request-contact"><span><Phone size={15} /> {report.contactName}: {report.contactPhone}</span></div>
                  <div className="evidence-grid">{report.evidenceUrls.map((url) => <a href={url} target="_blank" rel="noreferrer" key={url}><img src={url} alt="Evidencia enviada" /></a>)}</div>
                  <div className="card-actions">
                    <button className="button button-secondary" type="button" onClick={() => updateReport(report.id, 'contacted')}>Contactado</button>
                    <button className="button button-primary" type="button" onClick={() => updateReport(report.id, 'verified')}>Verificado</button>
                    <button className="button button-danger" type="button" onClick={() => updateReport(report.id, 'dismissed')}>Descartar</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="detail-section"><h2>Comentarios</h2><CommentsPanel publicationId={pet.id} /></section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Información sobre ${pet.name}`} description="Incluye fotografías claras y el lugar exacto para que la persona responsable pueda verificarlo." size="lg">
        <form className="modal-form-grid" onSubmit={submitReport}>
          <label className="field"><span>Tipo de reporte</span><select className="select" value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}><option value="sighting">La vi recientemente</option><option value="found">La encontré y está conmigo</option></select></label>
          <label className="field"><span>Fecha y hora</span><input className="input" type="datetime-local" required value={form.seenAt} onChange={(e) => setForm({ ...form, seenAt: e.target.value })} /></label>
          <label className="field field-full"><span>Lugar exacto</span><input className="input" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
          <label className="field"><span>Tu nombre</span><input className="input" required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></label>
          <label className="field"><span>Tu teléfono</span><input className="input" required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></label>
          <label className="field field-full"><span>¿Qué viste o cómo la encontraste?</span><textarea className="textarea" required minLength={10} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="field field-full"><span>Fotos o pruebas (obligatorio)</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={(e) => setEvidenceFiles([...e.target.files].slice(0, 6))} /><small><Camera size={14} /> Hasta 6 imágenes.</small></label>
          <div className="modal-actions field-full"><button className="button button-secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</button><button className="button button-primary" disabled={saving} type="submit">{saving ? 'Enviando...' : 'Enviar información'}</button></div>
        </form>
      </Modal>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Editar publicacion de ${pet.name}`} description="Solo el propietario puede editar esta publicacion. Los cambios volveran a revision si ya estaba aprobada." size="lg">
        <form className="modal-form-grid" onSubmit={submitEdit}>
          <label className="field"><span>Nombre</span><input className="input" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></label>
          <label className="field"><span>Tipo</span><select className="select" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}><option>Perro</option><option>Gato</option><option>Ave</option><option>Otro</option></select></label>
          <label className="field"><span>Raza</span><input className="input" value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })} /></label>
          <label className="field"><span>Sexo</span><select className="select" value={editForm.sex} onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}><option value="">No especificado</option><option>Macho</option><option>Hembra</option></select></label>
          <label className="field"><span>Tamano</span><select className="select" value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}><option value="">No especificado</option><option>Pequeno</option><option>Mediano</option><option>Grande</option></select></label>
          <label className="field"><span>Zona</span><input className="input" required value={editForm.zone} onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })} /></label>
          <label className="field"><span>Ultima vez visto</span><input className="input" type="datetime-local" required value={editForm.lastSeen} onChange={(e) => setEditForm({ ...editForm, lastSeen: e.target.value })} /></label>
          <label className="field"><span>Contacto</span><input className="input" required value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} /></label>
          <label className="field"><span>Telefono</span><input className="input" required value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} /></label>
          <label className="field"><span>Estado del caso</span><select className="select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Activo</option><option value="found">Encontrado</option><option value="closed">Cerrado</option></select></label>
          <label className="field field-full"><span>Fotografias nuevas (opcional, reemplazan las actuales)</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setEditImageFiles([...e.target.files].slice(0, 6))} /></label>
          <label className="field field-full"><span>Descripcion y senas particulares</span><textarea className="textarea" required minLength={10} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></label>
          <div className="modal-actions field-full"><button className="button button-secondary" type="button" onClick={() => setEditOpen(false)}>Cancelar</button><button className="button button-primary" disabled={editing} type="submit">{editing ? 'Guardando...' : 'Guardar cambios'}</button></div>
        </form>
      </Modal>
    </section>
  );
}
