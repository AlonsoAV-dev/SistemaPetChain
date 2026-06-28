import { Heart, PawPrint, Search, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adoptionsApi, lostPetsApi, responsibleActionsApi } from '../../../shared/api/vetchainApi.js';
import StatCard from '../../../shared/components/StatCard.jsx';
import LoadingState from '../../../shared/components/LoadingState.jsx';

export default function CommunityPage() {
  const [data, setData] = useState({ lost: [], adoptions: [], actions: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([lostPetsApi.list(), adoptionsApi.list(), responsibleActionsApi.list()])
      .then(([lost, adoptions, actions]) => setData({ lost, adoptions, actions }))
      .catch((apiError) => setError(apiError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Cargando comunidad..." />;

  return (
    <section className="module-section">
      <header className="module-header"><div><h1>Comunidad PetChain</h1><p>Resumen del impacto generado por las publicaciones aprobadas.</p></div></header>
      {error && <p className="form-error">{error}</p>}
      <div className="stats-grid">
        <StatCard icon={Search} label="Reportes activos" value={data.lost.length} />
        <StatCard icon={Heart} label="En adopción" value={data.adoptions.length} />
        <StatCard icon={Trophy} label="Acciones verificadas" value={data.actions.length} />
        <StatCard icon={PawPrint} label="Impacto total" value={data.lost.length + data.adoptions.length + data.actions.length} />
      </div>
      <section className="panel community-ranking">
        <div className="panel-title"><h2>Acciones destacadas</h2><p>Ordenadas por reconocimiento comunitario.</p></div>
        {[...data.actions].sort((a, b) => b.likes - a.likes).slice(0, 8).map((action, index) => (
          <div className="ranking-row" key={action.id}><strong>#{index + 1}</strong><div><b>{action.title}</b><span>{action.author} · {action.category}</span></div><span>{action.likes} me gusta · {action.points} pts</span></div>
        ))}
      </section>
    </section>
  );
}
