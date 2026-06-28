import {
  Award,
  Edit3,
  Eye,
  Gift,
  Heart,
  Medal,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import { mediaApi, responsibleActionsApi } from '../../../shared/api/vetchainApi.js';
import CommentsPanel from '../../../shared/components/CommentsPanel.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';
import LoadingState from '../../../shared/components/LoadingState.jsx';

const defaultCategory = 'Cuidado cotidiano de mascotas';

function makeEmptyForm(category = defaultCategory) {
  return {
    title: '',
    category,
    description: '',
    actionDate: new Date().toISOString().slice(0, 10),
    location: '',
    evidenceUrl: '',
  };
}

const emptyRewards = {
  period: null,
  rules: [],
  ranking: [],
  historicalRanking: [],
  userProgress: null,
  previousWinners: [],
};

function moderationLabel(status) {
  if (status === 'approved') return 'Aprobado';
  if (status === 'rejected') return 'Rechazado';
  return 'Pendiente';
}

export default function ActionsPage() {
  const session = getStoredSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canPublish = Boolean(session?.user);
  const returnToAdmin = searchParams.get('from') === 'admin-publications';
  const shouldOpenCreate = searchParams.get('create') === '1';
  const [tab, setTab] = useState('public');
  const [actions, setActions] = useState([]);
  const [myActions, setMyActions] = useState([]);
  const [rewards, setRewards] = useState(emptyRewards);
  const [rankingMode, setRankingMode] = useState('monthly');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(makeEmptyForm());
  const [imageFile, setImageFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [commentsFor, setCommentsFor] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const openCreate = useCallback(() => {
    setEditing(null);
    setImageFile(null);
    setForm(makeEmptyForm(rewards.rules[0]?.category ?? defaultCategory));
    setFormOpen(true);
  }, [rewards.rules]);

  const loadData = useCallback(async () => {
    const requests = [responsibleActionsApi.list(), responsibleActionsApi.rewards()];
    if (canPublish) requests.push(responsibleActionsApi.mine());
    const [publicResult, rewardsResult, mineResult] = await Promise.all(requests);
    setActions(publicResult);
    setRewards(rewardsResult);
    if (mineResult) setMyActions(mineResult);
  }, [canPublish]);

  useEffect(() => {
    loadData().catch((apiError) => setError(apiError.message)).finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    if (shouldOpenCreate && canPublish && rewards.rules.length > 0) openCreate();
  }, [shouldOpenCreate, canPublish, openCreate, rewards.rules.length]);

  const visibleActions = tab === 'mine' ? myActions : actions;
  const filteredActions = useMemo(
    () => visibleActions.filter((action) =>
      `${action.title} ${action.category} ${action.author}`.toLowerCase().includes(query.toLowerCase())),
    [visibleActions, query],
  );
  const selectedRule = rewards.rules.find((rule) => rule.category === form.category);
  const progress = rewards.userProgress;
  const threshold = rewards.period?.qualificationPoints ?? 15;
  const monthlyPoints = progress?.points ?? 0;
  const leaderPoints = rewards.ranking[0]?.points ?? 0;
  const progressScale = Math.max(threshold, leaderPoints, monthlyPoints, 1);
  const progressPercent = Math.round((monthlyPoints / progressScale) * 100);
  const thresholdMarker = Math.round((threshold / progressScale) * 100);
  const visibleRanking = rankingMode === 'monthly' ? rewards.ranking : rewards.historicalRanking;

  function openEdit(action) {
    setEditing(action);
    setImageFile(null);
    setForm({
      title: action.title,
      category: action.category,
      description: action.description,
      actionDate: action.actionDate?.slice(0, 10) ?? makeEmptyForm().actionDate,
      location: action.location ?? '',
      evidenceUrl: action.evidenceUrl ?? '',
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
      const evidenceUrl = imageFile
        ? (await mediaApi.uploadImage(imageFile, 'evidence')).url
        : form.evidenceUrl;
      const payload = { ...form, evidenceUrl };
      if (editing) await responsibleActionsApi.update(editing.id, payload);
      else await responsibleActionsApi.create(payload);
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

  async function addLike(id) {
    try {
      const updated = await responsibleActionsApi.like(id);
      setActions((current) => current.map((action) => action.id === id ? updated : action));
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function removeAction(id) {
    if (!window.confirm('¿Eliminar esta acción? Los puntos acreditados también se revertirán.')) return;
    try {
      await responsibleActionsApi.remove(id);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  if (loading) return <LoadingState label="Cargando acciones responsables..." />;

  return (
    <section className="module-section actions-module">
      <header className="module-header">
        <div><h1>Acciones responsables</h1><p>Comparte únicamente acciones verificables relacionadas con el cuidado y bienestar de los animales.</p></div>
        {canPublish && <button className="button button-primary" type="button" onClick={openCreate}><Plus size={18} /> Nueva acción</button>}
      </header>

      {rewards.period && (
        <section className="action-reward-overview">
          <article className="action-progress-card">
            <div className="card-title-row"><div><span className="eyebrow">Tu puntaje mensual</span><h2>{monthlyPoints} puntos acumulados</h2></div><Trophy size={26} /></div>
            <div className="reward-progress-track"><span className="reward-progress-fill" style={{ width: `${progressPercent}%` }} /><span className="reward-progress-marker" style={{ left: `${thresholdMarker}%` }} title={`Clasificación al sorteo: ${threshold} puntos`} /></div>
            <div className="reward-progress-legend"><span>Sorteo desde {threshold} pts</span><span>{leaderPoints > 0 ? `Líder: ${leaderPoints} pts` : 'Aún sin líder'}</span></div>
            <p>{progress?.qualified ? `Ya clasificaste al sorteo. Sigue acumulando para competir por el primer puesto${progress?.position ? `; actualmente vas #${progress.position}` : ''}.` : `Te faltan ${progress?.pointsRemaining ?? threshold} puntos y ${progress?.actionsRemaining ?? rewards.period.minimumActions} acciones requeridas para el sorteo.`}</p>
          </article>
          <article className="reward-prize-card"><Medal size={24} /><div><span>Premio del primer puesto</span><strong>{rewards.period.firstPlacePrize}</strong></div></article>
          <article className="reward-prize-card"><Gift size={24} /><div><span>Premio del sorteo</span><strong>{rewards.period.rafflePrize}</strong></div></article>
        </section>
      )}

      <div className="module-toolbar">
        <div className="segmented-tabs">
          <button className={tab === 'public' ? 'active' : ''} type="button" onClick={() => setTab('public')}>Publicadas</button>
          {canPublish && <button className={tab === 'mine' ? 'active' : ''} type="button" onClick={() => setTab('mine')}>Mis acciones</button>}
          <button className={tab === 'ranking' ? 'active' : ''} type="button" onClick={() => setTab('ranking')}>Ranking y sorteo</button>
        </div>
        {tab !== 'ranking' && <label className="search-box module-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar acciones o voluntarios" /></label>}
      </div>

      {error && <p className="form-error">{error}</p>}

      {tab === 'ranking' ? (
        <div className="rewards-layout">
          <section className="panel monthly-ranking-panel">
            <div className="ranking-panel-heading">
              <div className="panel-title"><h2>{rankingMode === 'monthly' ? 'Ranking mensual' : 'Ranking histórico'}</h2><p>{rankingMode === 'monthly' ? 'Solo cuentan las acciones aprobadas dentro del periodo actual.' : 'Reconocimiento acumulado de acciones actualmente aprobadas.'}</p></div>
              <div className="segmented-tabs"><button className={rankingMode === 'monthly' ? 'active' : ''} type="button" onClick={() => setRankingMode('monthly')}>Mensual</button><button className={rankingMode === 'historical' ? 'active' : ''} type="button" onClick={() => setRankingMode('historical')}>Histórico</button></div>
            </div>
            <div className="ranking-list">
              {visibleRanking.length === 0 && <div className="empty-state">Todavía no hay acciones puntuadas.</div>}
              {visibleRanking.map((entry) => (
                <div className={`reward-ranking-row${entry.userId === session?.user?.id ? ' is-current-user' : ''}`} key={entry.userId}>
                  <strong>#{entry.position}</strong>
                  <span className="avatar">{entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : entry.name.charAt(0)}</span>
                  <div><b>{entry.name}</b><span>{entry.approvedActions} acciones · {entry.distinctCategories} categorías</span></div>
                  <div className="ranking-points"><strong>{entry.points} pts</strong>{rankingMode === 'monthly' && entry.qualified && <small>Clasificado</small>}</div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rewards-side-column">
            <section className="panel reward-rules-card">
              <div className="panel-title"><h2>Rangos de puntos</h2><p>El administrador asigna el valor final dentro de estos límites.</p></div>
              {rewards.rules.map((rule) => <div className="point-rule-row" key={rule.category}><span>{rule.category}{rule.monthlyLimit && <small>Máximo {rule.monthlyLimit} al mes</small>}</span><strong>{rule.minPoints}–{rule.maxPoints}</strong></div>)}
            </section>
            <section className="panel raffle-rules-card">
              <Award size={24} />
              <h2>¿Cómo clasifico?</h2>
              <p>Alcanza {threshold} puntos y al menos {rewards.period?.minimumActions ?? 2} acciones aprobadas. El primer puesto gana un premio y no participa en el sorteo.</p>
            </section>
            {rewards.previousWinners.length > 0 && (
              <section className="panel previous-winners-card">
                <div className="panel-title"><h2>Ganadores anteriores</h2></div>
                {rewards.previousWinners.map((period) => <div className="previous-winner-row" key={period.id}><strong>{period.name}</strong><span>1.º {period.firstPlaceName} · Sorteo: {period.raffleWinnerName}</span></div>)}
              </section>
            )}
          </aside>
        </div>
      ) : (
        <>
          {filteredActions.length === 0 && <div className="empty-state">No hay acciones para mostrar.</div>}
          <div className="records-grid">
            {filteredActions.map((action) => (
              <article className="post-card clickable-card" key={action.id} role="link" tabIndex={0} onClick={() => navigate(`/app/acciones/${action.id}`)} onKeyDown={(event) => event.key === 'Enter' && navigate(`/app/acciones/${action.id}`)}>
                <div className="pet-media action" style={action.evidenceUrl ? { backgroundImage: `linear-gradient(rgba(24,38,31,.45), rgba(24,38,31,.45)), url(${action.evidenceUrl})`, backgroundSize: 'cover' } : undefined}>
                  <span className={`status-badge ${action.moderationStatus === 'approved' ? 'success' : action.moderationStatus === 'rejected' ? 'danger' : 'warning'}`}><Trophy size={14} />{action.moderationStatus === 'approved' ? `+${action.points} pts` : action.moderationStatus === 'rejected' ? 'Sin puntos' : 'Por evaluar'}</span>
                  <span className="meta-pill">{action.category}</span>
                </div>
                <div className="post-card-body">
                  <div className="card-title-row"><h3>{action.title}</h3>{tab === 'mine' && <StatusBadge status={moderationLabel(action.moderationStatus)} />}</div>
                  <p>{action.description}</p>
                  {action.location && <span className="muted-copy">{action.location}</span>}
                  {action.scoringReason && <p className="score-explanation">Puntaje: {action.scoringReason}</p>}
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
        </>
      )}

      <Modal open={formOpen} onClose={closeForm} title={editing ? 'Editar acción responsable' : 'Nueva acción responsable'} description="Solo se aceptan acciones relacionadas con animales. La publicación será revisada y puntuada por un administrador diferente al autor." size="lg">
        <form className="modal-form-grid" onSubmit={submit}>
          <label className="field field-full"><span>Título</span><input className="input" required minLength={4} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label className="field"><span>Categoría</span><select className="select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{rewards.rules.map((rule) => <option key={rule.category}>{rule.category}</option>)}</select>{selectedRule && <small>Rango: {selectedRule.minPoints}–{selectedRule.maxPoints} puntos · Máximo {selectedRule.monthlyLimit} veces al mes</small>}</label>
          <label className="field"><span>Fecha</span><input className="input" type="date" required value={form.actionDate} onChange={(event) => setForm({ ...form, actionDate: event.target.value })} /></label>
          <label className="field field-full"><span>Ubicación</span><input className="input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
          <label className="field field-full"><span>Descripción</span><textarea className="textarea" required minLength={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label className="field field-full"><span>Evidencia fotográfica</span><input className="input" type="file" required={!editing && !form.evidenceUrl} accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /><small>Debe permitir verificar la acción. La evidencia es obligatoria.</small></label>
          <div className="modal-actions field-full"><button className="button button-secondary" type="button" onClick={closeForm}>Cancelar</button><button className="button button-primary" disabled={saving} type="submit">{saving ? 'Guardando...' : editing ? 'Guardar y reenviar' : 'Enviar a revisión'}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(commentsFor)} onClose={() => setCommentsFor(null)} title={`Comentarios sobre ${commentsFor?.title ?? ''}`} size="lg">
        {commentsFor && <CommentsPanel publicationId={commentsFor.id} />}
      </Modal>
    </section>
  );
}
