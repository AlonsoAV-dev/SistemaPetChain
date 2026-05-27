import { Heart, Plus, Search, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { responsibleActionsApi } from '../../../shared/api/vetchainApi.js';
import { getStoredSession } from '../../../shared/api/httpClient.js';

const emptyForm = {
  title: '',
  category: 'Bienestar animal',
  description: '',
  author: '',
};

export default function ActionsPage() {
  const defaultAuthor = getStoredSession()?.user?.name ?? '';
  const [actions, setActions] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    author: defaultAuthor,
  }));
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    responsibleActionsApi
      .list()
      .then((data) => {
        if (isMounted) setActions(data);
      })
      .catch((apiError) => {
        console.warn('No se pudieron cargar acciones desde el backend:', apiError.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredActions = useMemo(() => {
    return actions.filter((action) =>
      `${action.title} ${action.category} ${action.author}`.toLowerCase().includes(query.toLowerCase()),
    );
  }, [actions, query]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setError('');

    try {
      const createdAction = await responsibleActionsApi.create(form);
      setActions((current) => [createdAction, ...current]);
      setForm({ ...emptyForm, author: defaultAuthor });
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function addLike(id) {
    try {
      const updatedAction = await responsibleActionsApi.like(id);
      setActions((current) =>
        current.map((action) => (action.id === id ? updatedAction : action)),
      );
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="page-title">
          <h1>Acciones responsables</h1>
          <p>Comparte buenas acciones, reconoce a voluntarios y suma puntos comunitarios.</p>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="panel">
          <div className="panel-title">
            <h2>Nueva accion</h2>
            <p>Registra una accion positiva de la comunidad.</p>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Titulo</span>
              <input className="input" name="title" value={form.title} onChange={handleChange} placeholder="Ej. Limpieza del parque" />
            </label>
            <label className="field">
              <span>Categoria</span>
              <select className="select" name="category" value={form.category} onChange={handleChange}>
                <option>Bienestar animal</option>
                <option>Medio ambiente</option>
                <option>Ayuda comunitaria</option>
                <option>Adopcion responsable</option>
              </select>
            </label>
            <label className="field">
              <span>Responsable</span>
              <input className="input" name="author" value={form.author} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Descripcion</span>
              <textarea className="textarea" name="description" value={form.description} onChange={handleChange} placeholder="Que se hizo y cual fue el impacto" />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="button button-primary" type="submit">
              <Plus size={18} aria-hidden="true" />
              Publicar accion
            </button>
          </form>
        </aside>

        <div className="content" style={{ padding: 0 }}>
          <div className="toolbar">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar acciones o voluntarios" />
            </label>
          </div>

          <div className="records-grid">
            {filteredActions.map((action) => (
              <article className="post-card" key={action.id}>
                <div className="pet-media action">
                  <span className="status-badge success"><Trophy size={14} />+{action.points} pts</span>
                  <span className="meta-pill">{action.category}</span>
                </div>
                <div className="post-card-body">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                  <div className="activity-item" style={{ padding: 0, border: 0 }}>
                    <span>{action.author}</span>
                    <button className="button button-secondary" type="button" onClick={() => addLike(action.id)}>
                      <Heart size={17} aria-hidden="true" />
                      {action.likes}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
