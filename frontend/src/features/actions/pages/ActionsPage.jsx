import { Heart, Plus, Search, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { responsibleActions as initialActions } from '../../../shared/data/mockData.js';
import { nextId } from '../../../shared/utils/format.js';

const emptyForm = {
  title: '',
  category: 'Bienestar animal',
  description: '',
  author: 'Alonso Almerco',
};

export default function ActionsPage() {
  const [actions, setActions] = useState(initialActions);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);

  const filteredActions = useMemo(() => {
    return actions.filter((action) =>
      `${action.title} ${action.category} ${action.author}`.toLowerCase().includes(query.toLowerCase()),
    );
  }, [actions, query]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

    setActions((current) => [
      {
        id: nextId(current),
        ...form,
        points: 30,
        likes: 0,
      },
      ...current,
    ]);
    setForm(emptyForm);
  }

  function addLike(id) {
    setActions((current) =>
      current.map((action) => (action.id === id ? { ...action, likes: action.likes + 1 } : action)),
    );
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

