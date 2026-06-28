import {
  Check,
  Clock,
  ExternalLink,
  Gift,
  Heart,
  Plus,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  Trophy,
  Shuffle,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../../shared/api/vetchainApi.js';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import Modal from '../../../shared/components/Modal.jsx';
import StatCard from '../../../shared/components/StatCard.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';
import LoadingState from '../../../shared/components/LoadingState.jsx';

const validSections = new Set(['moderation', 'publications', 'comments', 'users', 'rewards']);

const sectionMeta = {
  moderation: {
    title: 'Panel administrativo',
    description: 'Revisa lo urgente: publicaciones pendientes, estado general y accesos rápidos.',
  },
  publications: {
    title: 'Gestión de publicaciones',
    description: 'Filtra adopciones, mascotas perdidas y acciones responsables para revisar su estado.',
  },
  comments: {
    title: 'Gestión de comentarios',
    description: 'Modera comentarios publicados en las publicaciones del sistema.',
  },
  users: {
    title: 'Gestión de usuarios',
    description: 'Crea usuarios, revisa roles, actividad y fecha de registro.',
  },
  rewards: {
    title: 'Puntos y sorteos',
    description: 'Configura el reto mensual, revisa los premios y realiza sorteos auditables.',
  },
};

const adminRoutes = {
  moderation: '/app/admin',
  publications: '/app/admin/publicaciones',
  comments: '/app/admin/comentarios',
  users: '/app/admin/usuarios',
  rewards: '/app/admin/recompensas',
};

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

const publicationCreateActions = [
  {
    to: '/app/adopciones?create=1&from=admin-publications',
    label: 'Nueva adopción',
    description: 'Publica una mascota disponible para adopción responsable.',
    icon: Heart,
  },
  {
    to: '/app/mascotas-perdidas?create=1&from=admin-publications',
    label: 'Mascota perdida',
    description: 'Registra un caso de búsqueda con fotos y datos de contacto.',
    icon: Search,
  },
  {
    to: '/app/acciones?create=1&from=admin-publications',
    label: 'Acción responsable',
    description: 'Comparte campañas, rescates o actividades comunitarias.',
    icon: Trophy,
  },
];

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
};

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function publicationPath(item, fromSection) {
  const from = `from=admin-${fromSection}`;
  if (item.type === 'lost_pet') return `/app/mascotas-perdidas/${item.id}?${from}`;
  if (item.type === 'adoption') return `/app/adopciones/${item.id}?${from}`;
  return `/app/acciones/${item.id}?${from}`;
}

export default function AdminPage({ section = 'moderation' }) {
  const navigate = useNavigate();
  const currentAdminId = getStoredSession()?.user?.id;
  const tab = validSections.has(section) ? section : 'moderation';
  const [summary, setSummary] = useState({ users: 0, pending: 0, approved: 0, rejected: 0, comments: 0 });
  const [moderation, setModeration] = useState([]);
  const [publications, setPublications] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [query, setQuery] = useState('');
  const [publicationType, setPublicationType] = useState('all');
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [scoreForm, setScoreForm] = useState({ points: '', pointReason: '' });
  const [reason, setReason] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({ qualificationPoints: 15, minimumActions: 2, firstPlacePrize: '', rafflePrize: '' });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [summaryData, moderationData, publicationsData, commentsData, usersData, rewardsData] = await Promise.all([
      adminApi.getSummary(),
      adminApi.listModeration(),
      adminApi.listPublications(),
      adminApi.listComments(),
      adminApi.listUsers(),
      adminApi.listRewards(),
    ]);
    setSummary(summaryData);
    setModeration(moderationData);
    setPublications(publicationsData);
    setComments(commentsData);
    setUsers(usersData);
    setRewards(rewardsData);
  }, []);

  useEffect(() => {
    loadData().catch((apiError) => setError(apiError.message)).finally(() => setLoading(false));
  }, [loadData]);

  const normalizedQuery = query.toLowerCase();
  const sectionInfo = sectionMeta[tab];
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
  async function approve(item) {
    if (item.type === 'responsible_action' && item.ownerId === currentAdminId) {
      setError('Tu propia acción debe ser evaluada por otro administrador.');
      return;
    }
    if (item.type === 'responsible_action') {
      if (!Number.isInteger(item.minPoints) || !Number.isInteger(item.maxPoints)) {
        setError('Esta categoria no tiene un rango de puntos configurado.');
        return;
      }
      setScoring(item);
      setScoreForm({ points: item.minPoints, pointReason: '' });
      return;
    }

    setBusy(true);
    setError('');
    try {
      await adminApi.updateModeration(item.id, { status: 'Aprobado' });
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  }

  async function approveWithPoints(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.updateModeration(scoring.id, {
        status: 'Aprobado',
        points: Number(scoreForm.points),
        pointReason: scoreForm.pointReason,
      });
      setScoring(null);
      setScoreForm({ points: '', pointReason: '' });
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
      navigate(adminRoutes.users);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  }

  function openRewardEditor(period) {
    setEditingReward(period);
    setRewardForm({
      qualificationPoints: period.qualificationPoints,
      minimumActions: period.minimumActions,
      firstPlacePrize: period.firstPlacePrize,
      rafflePrize: period.rafflePrize,
    });
  }

  async function saveReward(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.updateReward(editingReward.id, {
        ...rewardForm,
        qualificationPoints: Number(rewardForm.qualificationPoints),
        minimumActions: Number(rewardForm.minimumActions),
      });
      setEditingReward(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  }

  async function drawReward(period) {
    if (!window.confirm(`¿Realizar el sorteo de ${period.name}? Esta acción no se puede repetir.`)) return;
    setBusy(true);
    setError('');
    try {
      const result = await adminApi.drawReward(period.id);
      window.alert(`Primer puesto: ${result.firstPlace.name}. Ganador del sorteo: ${result.raffleWinner.name}.`);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Cargando administración..." />;

  return (
    <section className="module-section">
      <header className="module-header">
        <div>
          <h1>{sectionInfo.title}</h1>
          <p>{sectionInfo.description}</p>
        </div>
        {tab === 'users' && (
          <button className="button button-primary" type="button" onClick={() => { setUserForm(emptyUserForm); setCreatingUser(true); }}>
            <UserPlus size={18} /> Crear usuario
          </button>
        )}
      </header>

      {tab === 'moderation' && (
        <>
          <section className="stats-grid">
            <a className="stat-card-link" href="#pendientes-aprobacion">
              <StatCard icon={Clock} label="Pendientes" value={summary.pending} detail="Requieren aprobación" />
            </a>
            <Link className="stat-card-link" to={adminRoutes.publications}>
              <StatCard icon={ShieldCheck} label="Aprobadas" value={summary.approved} detail="Ver publicaciones" />
            </Link>
            <Link className="stat-card-link" to={adminRoutes.publications}>
              <StatCard icon={XCircle} label="Rechazadas" value={summary.rejected} detail="Ver observadas" />
            </Link>
            <Link className="stat-card-link" to={adminRoutes.users}>
              <StatCard icon={Users} label="Usuarios" value={summary.users} detail="Ir a usuarios" />
            </Link>
          </section>
        </>
      )}

      <section className="panel admin-workspace">
        {tab === 'moderation' && (
          <div className="admin-section-heading" id="pendientes-aprobacion">
            <div>
              <span className="eyebrow">Moderación</span>
              <h2>Publicaciones pendientes por aprobar</h2>
              <p>Revisa cada solicitud y decide si se publica o se devuelve con observaciones.</p>
            </div>
            <strong>{filteredModeration.length} pendientes</strong>
          </div>
        )}

        {tab === 'publications' && (
          <div className="admin-create-panel">
            <div className="admin-section-heading">
              <div>
                <span className="eyebrow">Crear contenido</span>
                <h2>Nueva publicación</h2>
                <p>Como admin puedes publicar directamente adopciones, mascotas perdidas o acciones responsables.</p>
              </div>
            </div>
            <div className="admin-create-grid">
              {publicationCreateActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link className="admin-create-card" key={action.to} to={action.to}>
                    <span><Icon size={20} aria-hidden="true" /></span>
                    <div>
                      <strong>{action.label}</strong>
                      <small>{action.description}</small>
                    </div>
                    <Plus size={18} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {tab !== 'rewards' && (
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
        )}
        {error && <p className="form-error">{error}</p>}

        {tab === 'moderation' && (
          <div className="admin-list">
            {filteredModeration.length === 0 && <div className="empty-state">No hay publicaciones pendientes.</div>}
            {filteredModeration.map((item) => (
              <article className="admin-row admin-row-rich" key={item.id}>
                <div className="admin-row-content">
                  <div className="card-title-row"><strong>{item.title}</strong><StatusBadge status="Pendiente" /></div>
                  <span>{item.owner} · {item.typeLabel ?? typeLabels[item.type] ?? item.type}</span>
                  {item.type === 'responsible_action' && (
                    <div className="moderation-action-preview">
                      {item.evidenceUrl && <img src={item.evidenceUrl} alt="Evidencia presentada" />}
                      <div><strong>{item.category}</strong><span>Rango permitido: {item.minPoints ?? '-'}–{item.maxPoints ?? '-'} puntos{item.monthlyLimit ? ` · Máximo ${item.monthlyLimit} al mes` : ''}</span></div>
                    </div>
                  )}
                  <p>{item.description}</p>
                </div>
                <div className="admin-actions">
                  <Link className="button button-secondary" to={publicationPath(item, 'moderation')}><ExternalLink size={16} /> Ver detalle</Link>
                  <button className="button button-primary" disabled={busy || (item.type === 'responsible_action' && item.ownerId === currentAdminId)} type="button" onClick={() => approve(item)}><Check size={17} /> {item.type === 'responsible_action' && item.ownerId === currentAdminId ? 'Requiere otro admin' : item.type === 'responsible_action' ? 'Evaluar y aprobar' : 'Aprobar'}</button>
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
                    <td><Link className="button button-secondary" to={publicationPath(item, 'publications')}><ExternalLink size={15} /> Ver</Link></td>
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
              <thead><tr><th>Usuario</th><th>Rol</th><th>Registro</th><th>Publicaciones</th><th>Puntos</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong><small>{user.email}</small></td>
                    <td>{user.role}</td>
                    <td>{formatDate(user.createdAt)}</td>
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

        {tab === 'rewards' && (
          <div className="reward-admin-list">
            {rewards.length === 0 && <div className="empty-state">No hay periodos de recompensas.</div>}
            {rewards.map((period) => {
              const hasEnded = new Date(period.endsAt).getTime() <= Date.now();
              return (
                <article className="reward-admin-card" key={period.id}>
                  <div className="reward-admin-heading">
                    <div>
                      <span className="eyebrow">{period.status === 'drawn' ? 'Sorteo realizado' : hasEnded ? 'Periodo finalizado' : 'Periodo activo'}</span>
                      <h2>{period.name}</h2>
                      <p>{formatDate(period.startsAt)} – {formatDate(period.endsAt)} · {period.participants} participantes</p>
                    </div>
                    <StatusBadge status={period.status === 'drawn' ? 'Completado' : hasEnded ? 'Pendiente' : 'Activo'} />
                  </div>
                  <div className="reward-admin-grid">
                    <div><span>Clasificación</span><strong>{period.qualificationPoints} puntos y {period.minimumActions} acciones</strong></div>
                    <div><span>Primer puesto</span><strong>{period.firstPlacePrize}</strong><small>{period.firstPlaceName || 'Aún sin ganador'}</small></div>
                    <div><span>Sorteo</span><strong>{period.rafflePrize}</strong><small>{period.raffleWinnerName || 'Aún sin ganador'}</small></div>
                  </div>
                  {period.status !== 'drawn' && (
                    <div className="card-actions">
                      <button className="button button-secondary" type="button" onClick={() => openRewardEditor(period)}><Pencil size={16} /> Configurar</button>
                      <button className="button button-primary" disabled={busy || !hasEnded} type="button" onClick={() => drawReward(period)}><Shuffle size={16} /> {hasEnded ? 'Realizar sorteo' : 'Disponible al finalizar'}</button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Modal open={Boolean(rejecting)} onClose={() => setRejecting(null)} title="Rechazar publicación" description={rejecting?.title}>
        <form className="form-stack" onSubmit={reject}>
          <label className="field"><span>Motivo del rechazo</span><textarea className="textarea" required minLength={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explica qué debe corregir el usuario" /></label>
          <div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setRejecting(null)}>Cancelar</button><button className="button button-danger" disabled={busy} type="submit">Confirmar rechazo</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(scoring)} onClose={() => setScoring(null)} title="Asignar puntos y aprobar" description={scoring?.title}>
        <form className="form-stack" onSubmit={approveWithPoints}>
          {scoring?.evidenceUrl && <img className="scoring-evidence" src={scoring.evidenceUrl} alt="Evidencia de la acción" />}
          <div className="score-range-callout"><Trophy size={19} /><div><strong>{scoring?.category}</strong><span>El puntaje debe estar entre {scoring?.minPoints} y {scoring?.maxPoints}.</span></div></div>
          <label className="field"><span>Puntos asignados</span><input className="input" type="number" required min={scoring?.minPoints} max={scoring?.maxPoints} value={scoreForm.points} onChange={(event) => setScoreForm({ ...scoreForm, points: event.target.value })} /></label>
          <label className="field"><span>Justificación del puntaje</span><textarea className="textarea" required minLength={10} maxLength={1000} value={scoreForm.pointReason} onChange={(event) => setScoreForm({ ...scoreForm, pointReason: event.target.value })} placeholder="Explica el impacto, esfuerzo y calidad de la evidencia." /></label>
          <div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setScoring(null)}>Cancelar</button><button className="button button-primary" disabled={busy} type="submit"><Check size={17} /> Confirmar aprobación</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(editingReward)} onClose={() => setEditingReward(null)} title="Configurar reto mensual" description={editingReward?.name}>
        <form className="form-stack" onSubmit={saveReward}>
          <div className="modal-form-grid">
            <label className="field"><span>Puntos para clasificar</span><input className="input" type="number" required min="1" max="500" value={rewardForm.qualificationPoints} onChange={(event) => setRewardForm({ ...rewardForm, qualificationPoints: event.target.value })} /></label>
            <label className="field"><span>Acciones mínimas</span><input className="input" type="number" required min="1" max="20" value={rewardForm.minimumActions} onChange={(event) => setRewardForm({ ...rewardForm, minimumActions: event.target.value })} /></label>
          </div>
          <label className="field"><span>Premio del primer puesto</span><input className="input" required minLength={3} value={rewardForm.firstPlacePrize} onChange={(event) => setRewardForm({ ...rewardForm, firstPlacePrize: event.target.value })} /></label>
          <label className="field"><span>Premio del sorteo</span><input className="input" required minLength={3} value={rewardForm.rafflePrize} onChange={(event) => setRewardForm({ ...rewardForm, rafflePrize: event.target.value })} /></label>
          <div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setEditingReward(null)}>Cancelar</button><button className="button button-primary" disabled={busy} type="submit"><Gift size={17} /> Guardar configuración</button></div>
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
