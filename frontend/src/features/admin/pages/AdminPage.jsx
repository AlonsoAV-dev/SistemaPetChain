import { Check, Clock, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi, authApi, responsibleActionsApi } from '../../../shared/api/vetchainApi.js';
import StatCard from '../../../shared/components/StatCard.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [actionsCount, setActionsCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      adminApi.listModeration(),
      authApi.me(),
      responsibleActionsApi.list(),
    ]).then((results) => {
      if (!isMounted) return;

      const [moderationResult, userResult, actionsResult] = results;

      if (moderationResult.status === 'fulfilled') {
        setItems(moderationResult.value);
      } else {
        console.warn('No se pudo cargar moderación desde el backend:', moderationResult.reason?.message);
      }

      if (userResult.status === 'fulfilled') {
        setUser(userResult.value);
      }

      if (actionsResult.status === 'fulfilled') {
        setActionsCount(actionsResult.value.length);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function updateStatus(id, status) {
    setError('');

    try {
      const updatedItem = await adminApi.updateModeration(id, { status });
      setItems((current) => current.map((item) => (item.id === id ? updatedItem : item)));
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <>
      <section className="page-header">
        <div className="page-title">
          <h1>{user?.name ? `Administracion, ${user.name}` : 'Administracion'}</h1>
          <p>Moderacion basica de publicaciones, usuarios y contenido comunitario.</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard icon={Clock} label="Pendientes" value={items.filter((item) => item.status === 'Pendiente').length} detail="Requieren revision" />
        <StatCard icon={ShieldCheck} label="Aprobadas" value={items.filter((item) => item.status === 'Aprobado').length} detail="Listas para publicarse" />
        <StatCard icon={Users} label="Usuarios" value={user ? '1' : '—'} detail="Sesion administrativa activa" />
        <StatCard icon={Check} label="Acciones" value={actionsCount} detail="Buenas acciones reportadas" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <h2>Cola de moderacion</h2>
            <p>Aprueba, revisa o elimina publicaciones del MVP.</p>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}

        <div className="admin-list">
          {items.map((item) => (
            <article className="admin-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.owner} · {item.type}</span>
              </div>
              <StatusBadge status={item.status} />
              <div className="admin-actions">
                <button className="icon-button" type="button" title="Aprobar publicacion" onClick={() => updateStatus(item.id, 'Aprobado')}>
                  <Check size={18} aria-hidden="true" />
                </button>
                <button className="icon-button" type="button" title="Marcar como pendiente" onClick={() => updateStatus(item.id, 'Pendiente')}>
                  <Clock size={18} aria-hidden="true" />
                </button>
                <button className="icon-button" type="button" title="Eliminar publicacion" onClick={() => removeItem(item.id)}>
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
