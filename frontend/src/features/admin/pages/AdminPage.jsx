import { Check, Clock, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '../../../shared/api/vetchainApi.js';
import StatCard from '../../../shared/components/StatCard.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

export default function AdminPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    adminApi
      .listModeration()
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((apiError) => {
        console.warn('No se pudo cargar moderación desde el backend:', apiError.message);
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
          <h1>Administracion</h1>
          <p>Moderacion basica de publicaciones, usuarios y contenido comunitario.</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard icon={Clock} label="Pendientes" value={items.filter((item) => item.status === 'Pendiente').length} detail="Requieren revision" />
        <StatCard icon={ShieldCheck} label="Aprobadas" value={items.filter((item) => item.status === 'Aprobado').length} detail="Listas para publicarse" />
        <StatCard icon={Users} label="Usuarios" value="85" detail="Comunidad registrada" />
        <StatCard icon={Check} label="Acciones" value="34" detail="Buenas acciones reportadas" />
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
