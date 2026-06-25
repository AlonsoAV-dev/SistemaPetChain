import { ArrowLeft, Check, Edit3, Heart, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import { adoptionsApi, interactionsApi, mediaApi } from '../../../shared/api/vetchainApi.js';
import CommentsPanel from '../../../shared/components/CommentsPanel.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import PhotoGallery from '../../../shared/components/PhotoGallery.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

const emptyRequest = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  housing: '',
  experience: '',
  message: '',
};

const emptyEditForm = {
  name: '',
  type: 'Perro',
  age: '',
  breed: '',
  sex: '',
  personality: '',
  description: '',
  contactName: '',
  contactPhone: '',
  vaccinated: false,
  sterilized: false,
  status: 'available',
};

export default function AdoptionDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const session = getStoredSession();
  const [pet, setPet] = useState(null);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(() => ({
    ...emptyRequest,
    fullName: session?.user?.name ?? '',
    email: session?.user?.email ?? '',
  }));
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const item = await adoptionsApi.get(id);
    setPet(item);
    const canManage = item.ownerId === session?.user?.id || session?.user?.role === 'admin';
    if (canManage) {
      setRequests(await interactionsApi.listAdoptionRequests(id));
    }
  }, [id, session?.user?.id, session?.user?.role]);

  useEffect(() => {
    load().catch((apiError) => setError(apiError.message));
  }, [load]);

  async function submitRequest(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await interactionsApi.createAdoptionRequest(id, form);
      setModalOpen(false);
      setMessage('Solicitud enviada. La persona responsable recibió tus datos de contacto.');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateRequest(requestId, status) {
    try {
      await interactionsApi.updateAdoptionRequest(requestId, status);
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
      age: pet.age,
      breed: pet.breed ?? '',
      sex: pet.sex ?? '',
      personality: pet.personality,
      description: pet.description ?? '',
      contactName: pet.contact ?? '',
      contactPhone: pet.contactPhone ?? '',
      vaccinated: Boolean(pet.vaccinated),
      sterilized: Boolean(pet.sterilized),
      status: pet.status === 'Reservado' ? 'reserved' : pet.status === 'Adoptado' ? 'adopted' : pet.status === 'Cerrado' ? 'closed' : 'available',
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
      const updated = await adoptionsApi.update(pet.id, { ...editForm, imageUrls });
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
  const available = pet.status === 'En adopción';
  const fromAdmin = searchParams.get('from');
  const backLink = fromAdmin?.startsWith('admin-')
    ? { to: fromAdmin === 'admin-moderation' ? '/app/admin' : '/app/admin/publicaciones', label: 'Volver a administración' }
    : { to: '/app/adopciones', label: 'Volver a adopciones' };

  return (
    <section className="detail-page">
      <Link className="back-link" to={backLink.to}><ArrowLeft size={17} /> {backLink.label}</Link>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <div className="detail-layout">
        <PhotoGallery images={pet.images} alt={pet.name} />
        <article className="detail-summary">
          <div className="card-title-row">
            <div><span className="eyebrow">Adopción responsable</span><h1>{pet.name}</h1></div>
            <StatusBadge status={pet.status} />
          </div>
          <p className="detail-lead">{pet.description}</p>
          <div className="spec-grid">
            <div><span>Especie</span><strong>{pet.type}</strong></div>
            <div><span>Edad</span><strong>{pet.age}</strong></div>
            <div><span>Raza</span><strong>{pet.breed || 'No especificada'}</strong></div>
            <div><span>Sexo</span><strong>{pet.sex || 'No especificado'}</strong></div>
            <div><span>Vacunas</span><strong>{pet.vaccinated ? 'Al día' : 'No indicado'}</strong></div>
            <div><span>Esterilización</span><strong>{pet.sterilized ? 'Sí' : 'No indicada'}</strong></div>
          </div>
          <div className="detail-block"><h2>Personalidad</h2><p>{pet.personality}</p></div>
          <div className="contact-card">
            <strong>{pet.contact}</strong>
            <span><Phone size={16} /> {pet.contactPhone || 'Contacto mediante solicitud'}</span>
            <small>Responsable: {pet.ownerName}</small>
          </div>
          {isOwner && (
            <button className="button button-secondary detail-primary-action" type="button" onClick={openEdit}>
              <Edit3 size={18} /> Editar publicacion
            </button>
          )}
          {!isOwner && available && (
            <button className="button button-primary detail-primary-action" type="button" onClick={() => setModalOpen(true)}>
              <Heart size={18} /> Quiero adoptar
            </button>
          )}
        </article>
      </div>

      {canManage && (
        <section className="detail-section">
          <h2>Solicitudes recibidas</h2>
          {requests.length === 0 ? <div className="empty-state">Todavía no hay solicitudes.</div> : (
            <div className="request-list">
              {requests.map((request) => (
                <article className="request-card" key={request.id}>
                  <div className="card-title-row"><strong>{request.fullName}</strong><StatusBadge status={request.status} /></div>
                  <div className="request-contact">
                    <span><Phone size={15} /> {request.phone}</span>
                    <span><Mail size={15} /> {request.email}</span>
                    <span><MapPin size={15} /> {request.city} · {request.housing}</span>
                  </div>
                  <p>{request.message}</p>
                  {request.experience && <small>Experiencia: {request.experience}</small>}
                  <div className="card-actions">
                    <button className="button button-secondary" type="button" onClick={() => updateRequest(request.id, 'contacted')}>Marcar contactado</button>
                    <button className="button button-primary" type="button" onClick={() => updateRequest(request.id, 'accepted')}><Check size={16} /> Aceptar</button>
                    <button className="button button-danger" type="button" onClick={() => updateRequest(request.id, 'rejected')}>Rechazar</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="detail-section"><h2>Comentarios</h2><CommentsPanel publicationId={pet.id} /></section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Solicitud para adoptar a ${pet.name}`} description="Tus datos se enviarán únicamente a la persona responsable de esta publicación." size="lg">
        <form className="modal-form-grid" onSubmit={submitRequest}>
          <label className="field"><span>Nombre completo</span><input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label className="field"><span>Correo</span><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field"><span>Teléfono</span><input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="field"><span>Ciudad o distrito</span><input className="input" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label className="field field-full"><span>Tipo de vivienda</span><select className="select" required value={form.housing} onChange={(e) => setForm({ ...form, housing: e.target.value })}><option value="">Selecciona una opción</option><option>Casa propia</option><option>Casa alquilada con permiso</option><option>Departamento propio</option><option>Departamento alquilado con permiso</option></select></label>
          <label className="field field-full"><span>Experiencia con mascotas</span><textarea className="textarea" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></label>
          <label className="field field-full"><span>¿Por qué deseas adoptar?</span><textarea className="textarea" required minLength={10} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
          <p className="privacy-note field-full"><ShieldCheck size={16} /> La coordinación continuará por teléfono o correo con la persona responsable.</p>
          <div className="modal-actions field-full"><button className="button button-secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</button><button className="button button-primary" disabled={saving} type="submit">{saving ? 'Enviando...' : 'Enviar solicitud'}</button></div>
        </form>
      </Modal>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Editar publicacion de ${pet.name}`} description="Solo el propietario puede editar esta publicacion. Los cambios volveran a revision si ya estaba aprobada." size="lg">
        <form className="modal-form-grid" onSubmit={submitEdit}>
          <label className="field"><span>Nombre</span><input className="input" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></label>
          <label className="field"><span>Tipo</span><select className="select" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}><option>Perro</option><option>Gato</option><option>Conejo</option><option>Otro</option></select></label>
          <label className="field"><span>Edad</span><input className="input" required value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} placeholder="Ej. 8 meses" /></label>
          <label className="field"><span>Raza</span><input className="input" value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })} /></label>
          <label className="field"><span>Sexo</span><select className="select" value={editForm.sex} onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}><option value="">No especificado</option><option>Macho</option><option>Hembra</option></select></label>
          <label className="field"><span>Contacto</span><input className="input" required value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} /></label>
          <label className="field"><span>Telefono</span><input className="input" required value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} /></label>
          <label className="field"><span>Estado</span><select className="select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="available">En adopcion</option><option value="reserved">Reservado</option><option value="adopted">Adoptado</option><option value="closed">Cerrado</option></select></label>
          <label className="field field-full"><span>Personalidad</span><textarea className="textarea" required value={editForm.personality} onChange={(e) => setEditForm({ ...editForm, personality: e.target.value })} /></label>
          <label className="field field-full"><span>Historia, cuidados y requisitos</span><textarea className="textarea" required minLength={10} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></label>
          <label className="field field-full"><span>Fotografias nuevas (opcional, reemplazan las actuales)</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setEditImageFiles([...e.target.files].slice(0, 6))} /></label>
          <div className="check-row"><label><input type="checkbox" checked={editForm.vaccinated} onChange={(e) => setEditForm({ ...editForm, vaccinated: e.target.checked })} /> Vacunada</label><label><input type="checkbox" checked={editForm.sterilized} onChange={(e) => setEditForm({ ...editForm, sterilized: e.target.checked })} /> Esterilizada</label></div>
          <div className="modal-actions field-full"><button className="button button-secondary" type="button" onClick={() => setEditOpen(false)}>Cancelar</button><button className="button button-primary" disabled={editing} type="submit">{editing ? 'Guardando...' : 'Guardar cambios'}</button></div>
        </form>
      </Modal>
    </section>
  );
}
