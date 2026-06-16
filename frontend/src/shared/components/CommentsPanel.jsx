import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '../api/httpClient.js';
import { commentsApi } from '../api/vetchainApi.js';

export default function CommentsPanel({ publicationId }) {
  const session = getStoredSession();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    commentsApi.list(publicationId)
      .then((data) => mounted && setComments(data))
      .catch((apiError) => mounted && setError(apiError.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [publicationId]);

  async function submitComment(event) {
    event.preventDefault();
    if (!body.trim()) return;
    setError('');
    try {
      const comment = await commentsApi.create(publicationId, body);
      setComments((current) => [...current, comment]);
      setBody('');
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function removeComment(id) {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await commentsApi.remove(id);
      setComments((current) => current.filter((comment) => comment.id !== id));
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  return (
    <div className="comments-panel">
      <div className="section-heading">
        <MessageCircle size={19} aria-hidden="true" />
        <h3>Comentarios ({comments.length})</h3>
      </div>
      {loading && <p className="muted-copy">Cargando comentarios...</p>}
      {!loading && comments.length === 0 && <p className="muted-copy">Todavía no hay comentarios.</p>}
      <div className="comment-list">
        {comments.map((comment) => (
          <article className="comment-item" key={comment.id}>
            <div>
              <strong>{comment.authorName}</strong>
              <span>{new Date(comment.createdAt).toLocaleString('es-PE')}</span>
            </div>
            <p>{comment.body}</p>
            {comment.authorId === session?.user?.id && (
              <button className="text-button danger-text" type="button" onClick={() => removeComment(comment.id)}>
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </article>
        ))}
      </div>
      {session?.user && (
        <form className="comment-form" onSubmit={submitComment}>
          <textarea
            className="textarea"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Escribe un comentario..."
            maxLength={1000}
          />
          <button className="button button-primary" type="submit">
            <Send size={16} /> Comentar
          </button>
        </form>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
