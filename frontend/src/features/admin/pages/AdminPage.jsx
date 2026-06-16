import {
  Check,
  Clock,
  ExternalLink,
  FileText,
  MessageCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../../shared/api/vetchainApi.js';
import Modal from '../../../shared/components/Modal.jsx';
import StatCard from '../../../shared/components/StatCard.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

const typeLabels = {
  lost_pet: 'Mascota perdida',
  adoption: 'Adopción',
  responsible_action: 'Acción responsable',
};

const publicationTypeFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'lost_pet', label: 'Mascotas perdidas' },
  { value: 'adoption', label: 'Adopción' },
  { value: 'responsible_action', label: 'Acciones responsables' },
];

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
};

function publicationPath(item) {
  if (item.type === 'lost_pet') return `/app/mascotas-perdidas/${item.id}`;
  if (item.type === 'adoption') return `/app/adopciones/${item.id}`;
  return `/app/acciones/${item.id}`;
}

export default function AdminPage() {
  const [tab, setTab] = useState('moderation');
  const [summary, setSummary] = useState({ users: 0, pending: 0, approved: 0, rejected: 0, comments: 0 });
  const [moderation, setModeration] = useState([]);
  const [publications, setPublications] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [publicationType, setPublicationType] = useState('all');
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    const [summaryData, moderationData, publicationsData, commentsData, usersData] = await Promise.all([
      adminApi.getSummary(),
      adminApi.listModeration(),
      adminApi.listPublications(),
      adminApi.listComments(),
      adminApi.listUsers(),
    ]);
    setSummary(summaryData);
    setModeration(moderationData);
    setPublications(publicationsData);
    setComments(commentsData);
    setUsers(usersData);
  }, []);

  useEffect(() => {
    loadData().catch((apiError) => setError(apiError.message));
  }, [loadData]);

  const normalizedQuery = query.toLowerCase();
  const matchesPublicationType = useCallback(
    (item) => publicationType === 'all' || item.type === publicationType || item.publicationType === publicationType,
    [publicationType],
  );
  const filteredModeration = useMemo(
    () => moderation.filter((item) =>
      matchesPublicationType(item) &&
      `${item.title} ${item.owner} ${typeLabels[item.type] ?? item.type}`.toLowerCase().includes(normalizedQuery)),
    [matchesPublicationType, moderation, normalizedQuery],
  );
  const filteredPublications = useMemo(
    () => publications.filter((item) =>
      matchesPublicationType(item) &&
      `${item.title} ${item.ownerName} ${item.ownerEmail} ${typeLabels[item.type] ?? item.type}`.toLowerCase().includes(normalizedQuery)),
    [matchesPublicationType, publications, normalizedQuery],
  );
  const filteredComments = useMemo(
    () => comments.filter((item) => `${item.body} ${item.authorName} ${item.publicationTitle}`.toLowerCase().includes(normalizedQuery)),
    [comments, normalizedQuery],
  );
  const filteredUsers = useMemo(
    () => users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(normalizedQuery)),
    [users, normalizedQuery],
  );

  async function approve(id) {
    setBusy(true);
    setError('');
    try {
      await adminApi.updateModeration(id, { status: 'Aprobado' });
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  }

  async function reject(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.updateModeration(rejecting.id, { status: 'Rechazado', reason });
      setRejecting(null);
      setReason('');
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(id) {
    if (!window.confirm('¿Eliminar este comentario de forma permanente?')) return;
    try {
      await adminApi.deleteComment(id);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function toggleUser(user) {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function createUser(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.createUser(userForm);
      setUserForm(emptyUserForm);
      setCreatingUser(false);
      setTab('users');
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="module-section">
      <header className="module-header">
        <div>
          <h1>Panel administrativo</h1>
          <p>Modera publicaciones y comentarios, y controla el estado de los usuarios.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => { setUserForm(emptyUserForm); setCreatingUser(true); }}>
          <UserPlus size={18} /> Crear usuario
        </button>
      </header>

      <section className="stats-grid">
        <StatCard icon={Clock} label="Pendientes" value={summary.pending} detail="Esperando revisión" />
        <StatCard icon={ShieldCheck} label="Aprobadas" value={summary.approved} detail="Contenido publicado" />
        <StatCard icon={XCircle} label="Rechazadas" value={summary.rejected} detail="Contenido observado" />
        <StatCard icon={Users} label="Usuarios" value={summary.users} detail={`${summary.comments} comentarios`} />
      </section>

      <section className="panel admin-workspace">
        <div className="admin-tabs">
          <button className={tab === 'moderation' ? 'active' : ''} type="button" onClick={() => setTab('moderation')}><Clock size={17} /> Moderación <span>{summary.pending}</span></button>
          <button className={tab === 'publications' ? 'active' : ''} type="button" onClick={() => setTab('publications')}><FileText size={17} /> Publicaciones</button>
          <button className={tab === 'comments' ? 'active' : ''} type="button" onClick={() => setTab('comments')}><MessageCircle size={17} /> Comentarios</button>
          <button className={tab === 'users' ? 'active' : ''} type="button" onClick={() => setTab('users')}><Users size={17} /> Usuarios</button>
        </div>
        <div className="admin-filterbar">
          {(tab === 'moderation' || tab === 'publications') && (
            <div className="segmented-tabs publication-type-tabs" aria-label="Filtrar publicaciones por tipo">
              {publicationTypeFilters.map((filter) => (
                <button
                  className={publicationType === filter.value ? 'active' : ''}
                  key={filter.value}
                  type="button"
                  onClick={() => setPublicationType(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
          <label className="search-box admin-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en esta sección" /></label>
        </div>
        {error && <p className="form-error">{error}</p>}

        {tab === 'moderation' && (
          <div className="admin-list">
            {filteredModeration.length === 0 && <div className="empty-state">No hay publicaciones pendientes.</div>}
            {filteredModeration.map((item) => (
              <article className="admin-row admin-row-rich" key={item.id}>
                <div className="admin-row-content">
                  <div className="card-title-row"><strong>{item.title}</strong><StatusBadge status="Pendiente" /></div>
                  <span>{item.owner} · {item.typeLabel ?? typeLabels[item.type] ?? item.type}</span>
                  <p>{item.description}</p>
                </div>
                <div className="admin-actions">
                  <Link className="button button-secondary" to={publicationPath(item)}><ExternalLink size={16} /> Ver detalle</Link>
                  <button className="button button-primary" disabled={busy} type="button" onClick={() => approve(item.id)}><Check size={17} /> Aprobar</button>
                  <button className="button button-danger" disabled={busy} type="button" onClick={() => { setRejecting(item); setReason(''); }}><XCircle size={17} /> Rechazar</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === 'publications' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Publicación</th><th>Tipo</th><th>Autor</th><th>Estado</th><th>Comentarios</th><th>Puntos</th><th></th></tr></thead>
              <tbody>
                {filteredPublications.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleDateString('es-PE')}</small></td>
                    <td>{typeLabels[item.type] ?? item.type}</td>
                    <td>{item.ownerName}<small>{item.ownerEmail}</small></td>
                    <td><StatusBadge status={item.status} />{item.rejectionReason && <small>{item.rejectionReason}</small>}</td>
                    <td>{item.commentsCount}</td>
                    <td>{item.pointsAwarded}</td>
                    <td><Link className="button button-secondary" to={publicationPath(item)}><ExternalLink size={15} /> Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'comments' && (
          <div className="admin-list">
            {filteredComments.length === 0 && <div className="empty-state">No hay comentarios.</div>}
            {filteredComments.map((comment) => (
              <article className="admin-row admin-row-rich" key={comment.id}>
                <div className="admin-row-content">
                  <strong>{comment.authorName}</strong>
                  <span>{comment.authorEmail} · {typeLabels[comment.publicationType] ?? comment.publicationType}</span>
                  <p>{comment.body}</p>
                  <small>En: {comment.publicationTitle}</small>
                </div>
                <button className="button button-danger" type="button" onClick={() => deleteComment(comment.id)}><Trash2 size={17} /> Eliminar</button>
              </article>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Usuario</th><th>Rol</th><th>Publicaciones</th><th>Puntos</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong><small>{user.email}</small></td>
                    <td>{user.role}</td>
                    <td>{user.publicationsCount}</td>
                    <td>{user.points}</td>
                    <td><StatusBadge status={user.status === 'active' ? 'Activo' : 'Suspendido'} /></td>
                    <td>{user.role === 'user' && <button className={`button ${user.status === 'active' ? 'button-danger' : 'button-secondary'}`} type="button" onClick={() => toggleUser(user)}>{user.status === 'active' ? <UserRoundX size={16} /> : <UserRoundCheck size={16} />}{user.status === 'active' ? 'Suspender' : 'Reactivar'}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={Boolean(rejecting)} onClose={() => setRejecting(null)} title="Rechazar publicación" description={rejecting?.title}>
        <form className="form-stack" onSubmit={reject}>
          <label className="field"><span>Motivo del rechazo</span><textarea className="textarea" required minLength={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explica qué debe corregir el usuario" /></label>
          <div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setRejecting(null)}>Cancelar</button><button className="button button-danger" disabled={busy} type="submit">Confirmar rechazo</button></div>
        </form>
      </Modal>

      <Modal open={creatingUser} onClose={() => setCreatingUser(false)} title="Crear usuario" description="Elige si la cuenta será un usuario normal o un administrador.">
        <form className="form-stack" onSubmit={createUser}>
          <label className="field">
            <span>Nombre</span>
            <input className="input" required value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} />
          </label>
          <label className="field">
            <span>Correo</span>
            <input className="input" type="email" required value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
          </label>
          <label className="field">
            <span>Contraseña temporal</span>
            <input className="input" type="password" required minLength={8} value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} />
            <small>Debe tener mínimo 8 caracteres e incluir letras y números.</small>
          </label>
          <label className="field">
            <span>Tipo de cuenta</span>
            <select className="select" value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={() => setCreatingUser(false)}>Cancelar</button>
            <button className="button button-primary" disabled={busy} type="submit">{busy ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
