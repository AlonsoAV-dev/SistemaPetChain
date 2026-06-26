import { BookOpen, Edit3, Eye, HeartPulse, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import { articlesApi, mediaApi } from '../../../shared/api/vetchainApi.js';
import Modal from '../../../shared/components/Modal.jsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

const tabs = [
  {
    key: 'Educación',
    label: 'Educación',
    icon: BookOpen,
    description: 'Recursos para una tenencia responsable y mejor convivencia.',
  },
  {
    key: 'Salud',
    label: 'Salud',
    icon: HeartPulse,
    description: 'Contenido publicado para cuidar la salud de tus mascotas.',
  },
  {
    key: 'Prevención',
    label: 'Prevención',
    icon: HeartPulse,
    description: 'Noticias y guías para prevenir riesgos comunes.',
  },
];

const emptyForm = {
  category: 'Educación',
  title: '',
  description: '',
  content: '',
  imageUrl: '',
  published: true,
  sources: [{ label: '', url: '' }],
};

export default function ArticlesPage({ initialCategory = 'Educación' }) {
  const navigate = useNavigate();
  const isAdmin = getStoredSession()?.user?.role === 'admin';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const loadArticles = useCallback(async () => {
    setError('');
    try {
      setArticles(await articlesApi.list(activeCategory, { all: isAdmin }));
    } catch (apiError) {
      setError(apiError.message);
    }
  }, [activeCategory, isAdmin]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const activeTab = tabs.find((tab) => tab.key === activeCategory) ?? tabs[0];
  const Icon = activeTab.icon;
  const filtered = useMemo(
    () => articles.filter((article) =>
      `${article.title} ${article.category} ${article.description}`.toLowerCase().includes(query.toLowerCase())),
    [articles, query],
  );

  function openCreate() {
    setEditing(null);
    setImageFile(null);
    setForm({ ...emptyForm, category: activeCategory });
    setFormOpen(true);
  }

  function openEdit(article) {
    setEditing(article);
    setImageFile(null);
    setForm({
      category: article.category,
      title: article.title,
      description: article.description,
      content: article.content,
      imageUrl: article.image ?? '',
      published: article.published !== false,
      sources: article.sources?.length ? article.sources : [{ label: '', url: '' }],
    });
    setFormOpen(true);
  }

  function updateSource(index, field, value) {
    setForm((current) => ({
      ...current,
      sources: current.sources.map((source, sourceIndex) =>
        sourceIndex === index ? { ...source, [field]: value } : source),
    }));
  }

  function addSource() {
    setForm((current) => ({
      ...current,
      sources: [...current.sources, { label: '', url: '' }].slice(0, 8),
    }));
  }

  function removeSource(index) {
    setForm((current) => ({
      ...current,
      sources: current.sources.filter((_, sourceIndex) => sourceIndex !== index),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const imageUrl = imageFile
        ? (await mediaApi.uploadImage(imageFile, 'articles')).url
        : form.imageUrl;
      const payload = {
        ...form,
        imageUrl,
        sources: form.sources.filter((source) => source.label.trim() && source.url.trim()),
      };

      if (editing) await articlesApi.update(editing.id, payload);
      else await articlesApi.create(payload);

      setActiveCategory(payload.category);
      setFormOpen(false);
      await loadArticles();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeArticle(article) {
    if (!window.confirm(`¿Eliminar el artículo "${article.title}"?`)) return;

    try {
      await articlesApi.remove(article.id);
      await loadArticles();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  return (
    <section className="module-section">
      <header className="module-header">
        <div>
          <h1>Artículos</h1>
          <p>{activeTab.description}</p>
        </div>
        {isAdmin && (
          <button className="button button-primary" type="button" onClick={openCreate}>
            <Plus size={18} /> Nuevo artículo
          </button>
        )}
      </header>

      <div className="module-toolbar">
        <div className="segmented-tabs">
          {tabs.map((tab) => (
            <button
              className={activeCategory === tab.key ? 'active' : ''}
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="search-box module-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artículos o noticias" />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      {filtered.length === 0 && <div className="empty-state">No hay artículos publicados en esta categoría.</div>}
      <div className="article-grid content-library">
        {filtered.map((article) => (
          <article
            className="article-card clickable-card"
            key={article.id}
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/app/articulos/${article.id}`)}
            onKeyDown={(event) => event.key === 'Enter' && navigate(`/app/articulos/${article.id}`)}
          >
            {article.image ? <img src={article.image} alt={article.title} /> : <div className="article-placeholder"><Icon size={38} /></div>}
            <div className="article-card-body">
              <div className="card-title-row">
                <span className="category-pill">{article.category}</span>
                {isAdmin && <StatusBadge status={article.published === false ? 'Borrador' : 'Publicado'} />}
              </div>
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <div className="card-actions">
                <button className="button button-secondary" type="button" onClick={(event) => { event.stopPropagation(); navigate(`/app/articulos/${article.id}`); }}><Eye size={16} /> Ver</button>
                {isAdmin && (
                  <>
                    <button className="button button-secondary" type="button" onClick={(event) => { event.stopPropagation(); openEdit(article); }}><Edit3 size={16} /> Editar</button>
                    <button className="button button-danger" type="button" onClick={(event) => { event.stopPropagation(); removeArticle(article); }}><Trash2 size={16} /> Eliminar</button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar artículo' : 'Nuevo artículo'} description="Agrega contenido educativo, de salud o prevención para la comunidad." size="lg">
        <form className="modal-form-grid" onSubmit={submit}>
          <label className="field">
            <span>Categoría</span>
            <select className="select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {tabs.map((tab) => <option key={tab.key}>{tab.key}</option>)}
            </select>
          </label>
          <label className="field"><span>Estado</span><select className="select" value={form.published ? 'published' : 'draft'} onChange={(event) => setForm({ ...form, published: event.target.value === 'published' })}><option value="published">Publicado</option><option value="draft">Borrador</option></select></label>
          <label className="field field-full"><span>Título</span><input className="input" required minLength={4} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label className="field field-full"><span>Resumen</span><textarea className="textarea" required minLength={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label className="field field-full"><span>Contenido</span><textarea className="textarea article-editor-textarea" required minLength={20} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Escribe el artículo. Se respetarán los saltos de línea." /></label>
          <label className="field field-full"><span>Imagen</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /></label>
          {form.imageUrl && <label className="field field-full"><span>Imagen actual</span><input className="input" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label>}

          <div className="field field-full article-sources-editor">
            <div className="card-title-row">
              <span>Fuentes</span>
              <button className="text-button" type="button" onClick={addSource}>Agregar fuente</button>
            </div>
            {form.sources.map((source, index) => (
              <div className="source-form-row" key={`${index}-${source.url}`}>
                <input className="input" value={source.label} onChange={(event) => updateSource(index, 'label', event.target.value)} placeholder="Nombre de la fuente" />
                <input className="input" type="url" value={source.url} onChange={(event) => updateSource(index, 'url', event.target.value)} placeholder="https://..." />
                <button className="button button-secondary" type="button" onClick={() => removeSource(index)}>Quitar</button>
              </div>
            ))}
          </div>

          <div className="modal-actions field-full">
            <button className="button button-secondary" type="button" onClick={() => setFormOpen(false)}>Cancelar</button>
            <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Guardando...' : 'Guardar artículo'}</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
