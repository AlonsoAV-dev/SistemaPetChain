import { Edit3, Eye, MessageCircle, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import { lostPetsApi, mediaApi } from '../../../shared/api/vetchainApi.js';
import CommentsPanel from '../../../shared/components/CommentsPanel.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

const fallbackImage = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80';
const emptyForm = {
  name: '', type: 'Perro', breed: '', sex: '', size: '', zone: '',
  lastSeen: '', description: '', contactName: '', contactPhone: '', status: 'active',
};

export default function LostPetsPage() {
  const session = getStoredSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canPublish = Boolean(session?.user);
  const returnToAdmin = searchParams.get('from') === 'admin-publications';
  const shouldOpenCreate = searchParams.get('create') === '1';
  const [tab, setTab] = useState('public');
  const [pets, setPets] = useState([]);
  const [myPets, setMyPets] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback(() => {
    setEditing(null);
    setImageFiles([]);
    setForm({ ...emptyForm, contactName: session?.user?.name ?? '' });
    setFormOpen(true);
  }, [session?.user?.name]);

  const loadData = useCallback(async () => {
    const [publicResult, mineResult] = await Promise.all([
      lostPetsApi.list(),
      canPublish ? lostPetsApi.mine() : Promise.resolve([]),
    ]);
    setPets(publicResult);
    setMyPets(mineResult);
  }, [canPublish]);

  useEffect(() => {
    loadData().catch((apiError) => setError(apiError.message));
  }, [loadData]);

  useEffect(() => {
    if (shouldOpenCreate && canPublish) openCreate();
  }, [shouldOpenCreate, canPublish, openCreate]);

  const visiblePets = tab === 'mine' ? myPets : pets;
  const filteredPets = useMemo(
    () => visiblePets.filter((pet) =>
      `${pet.name} ${pet.zone} ${pet.type} ${pet.breed ?? ''}`.toLowerCase().includes(query.toLowerCase())),
    [visiblePets, query],
  );

  function openEdit(pet) {
    setEditing(pet);
    setImageFiles([]);
    setForm({
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
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    if (returnToAdmin && !editing) navigate('/app/admin/publicaciones');
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const uploaded = await Promise.all(
        imageFiles.map(async (file) => (await mediaApi.uploadImage(file, 'publications')).url),
      );
      const imageUrls = uploaded.length ? uploaded : editing?.images ?? [];
      if (editing) await lostPetsApi.update(editing.id, { ...form, imageUrls });
      else await lostPetsApi.create({ ...form, imageUrls });
      await loadData();
      if (returnToAdmin && !editing) {
        navigate('/app/admin/publicaciones');
        return;
      }
      setTab('mine');
      setFormOpen(false);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removePet(id) {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await lostPetsApi.remove(id);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  const goToDetail = (pet) => navigate(`/app/mascotas-perdidas/${pet.id}`);
  const stop = (handler) => (event) => {
    event.stopPropagation();
    handler();
  };

  return (
    <section className="module-section">
      <header className="module-header">
        <div><h1>Mascotas perdidas</h1><p>Consulta reportes, comparte pruebas y administra tus propios casos.</p></div>
        {canPublish && <button className="button button-primary" type="button" onClick={openCreate}><Plus size={18} /> Reportar mascota</button>}
      </header>

      <div className="module-toolbar">
        <div className="segmented-tabs">
          <button className={tab === 'public' ? 'active' : ''} type="button" onClick={() => setTab('public')}>Publicadas</button>
          {canPublish && <button className={tab === 'mine' ? 'active' : ''} type="button" onClick={() => setTab('mine')}>Mis publicaciones</button>}
        </div>
        <label className="search-box module-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, distrito, raza o tipo" /></label>
      </div>

      {error && <p className="form-error">{error}</p>}
      {filteredPets.length === 0 && <div className="empty-state">No hay reportes para mostrar.</div>}
      <div className="pet-grid">
        {filteredPets.map((pet) => (
          <article className="pet-card reference-pet-card clickable-card" key={pet.id} role="link" tabIndex={0} onClick={() => goToDetail(pet)} onKeyDown={(event) => event.key === 'Enter' && goToDetail(pet)}>
            <img src={pet.image || fallbackImage} alt={pet.name} />
            <div className="pet-card-body">
              <div className="card-title-row"><h3>{pet.name}</h3>{tab === 'mine' && <StatusBadge status={pet.moderationStatus === 'approved' ? 'Aprobado' : pet.moderationStatus === 'rejected' ? 'Rechazado' : 'Pendiente'} />}</div>
              <p>{pet.type}{pet.breed ? ` · ${pet.breed}` : ''} · {pet.zone}</p>
              <span>{pet.description}</span>
              {pet.rejectionReason && <p className="rejection-note">Motivo: {pet.rejectionReason}</p>}
              <div className="pet-card-footer"><small>{new Date(pet.lastSeen).toLocaleString('es-PE')}</small><StatusBadge status={pet.status} /></div>
              <div className="card-actions">
                <button className="button button-secondary" type="button" onClick={stop(() => goToDetail(pet))}><Eye size={16} /> Ver detalles</button>
                {tab === 'public' ? (
                  <button className="button button-secondary" type="button" onClick={stop(() => setCommentsFor(pet))}><MessageCircle size={16} /> Comentarios</button>
                ) : (
                  <>
                    <button className="button button-secondary" type="button" onClick={stop(() => openEdit(pet))}><Edit3 size={16} /> Editar</button>
                    <button className="button button-danger" type="button" onClick={stop(() => removePet(pet.id))}><Trash2 size={16} /> Eliminar</button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal open={formOpen} onClose={closeForm} title={editing ? 'Editar mascota perdida' : 'Reportar mascota perdida'} description={session?.user?.role === 'admin' ? 'Como administrador, esta publicación aparecerá inmediatamente.' : 'La publicación será revisada antes de aparecer públicamente.'} size="lg">
        <form className="modal-form-grid" onSubmit={submit}>
          <label className="field"><span>Nombre</span><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Tipo</span><select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Perro</option><option>Gato</option><option>Ave</option><option>Otro</option></select></label>
          <label className="field"><span>Raza</span><input className="input" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} /></label>
          <label className="field"><span>Sexo</span><select className="select" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}><option value="">No especificado</option><option>Macho</option><option>Hembra</option></select></label>
          <label className="field"><span>Tamaño</span><select className="select" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}><option value="">No especificado</option><option>Pequeño</option><option>Mediano</option><option>Grande</option></select></label>
          <label className="field"><span>Zona</span><input className="input" required value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} /></label>
          <label className="field"><span>Última vez visto</span><input className="input" type="datetime-local" required value={form.lastSeen} onChange={(e) => setForm({ ...form, lastSeen: e.target.value })} /></label>
          <label className="field"><span>Contacto</span><input className="input" required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></label>
          <label className="field"><span>Teléfono</span><input className="input" required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></label>
          {editing && <label className="field"><span>Estado del caso</span><select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Activo</option><option value="found">Encontrado</option><option value="closed">Cerrado</option></select></label>}
          <label className="field field-full"><span>Fotografías (hasta 6)</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple required={!editing} onChange={(e) => setImageFiles([...e.target.files].slice(0, 6))} /></label>
          <label className="field field-full"><span>Descripción y señas particulares</span><textarea className="textarea" required minLength={10} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="modal-actions field-full"><button className="button button-secondary" type="button" onClick={closeForm}>Cancelar</button><button className="button button-primary" disabled={saving} type="submit">{saving ? 'Guardando...' : editing ? 'Guardar cambios' : session?.user?.role === 'admin' ? 'Publicar ahora' : 'Enviar a revisión'}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(commentsFor)} onClose={() => setCommentsFor(null)} title={`Comentarios sobre ${commentsFor?.name ?? ''}`} size="lg">
        {commentsFor && <CommentsPanel publicationId={commentsFor.id} />}
      </Modal>
    </section>
  );
}
