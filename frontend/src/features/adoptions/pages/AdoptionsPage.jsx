import { Heart, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';
import { adoptionPets } from '../../../shared/data/mockData.js';

export default function AdoptionsPage() {
  const [query, setQuery] = useState('');

  const filteredPets = useMemo(() => {
    return adoptionPets.filter((pet) =>
      `${pet.name} ${pet.type} ${pet.personality}`.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  return (
    <section className="module-section">
      <header className="module-header">
        <div>
          <h1>Adopción responsable</h1>
          <p>Dale un hogar lleno de amor a una mascota que lo necesita.</p>
        </div>
        <button className="button button-primary" type="button">
          <Plus size={18} aria-hidden="true" />
          Publicar en adopción
        </button>
      </header>

      <label className="search-box module-search">
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, tipo o personalidad"
        />
      </label>

      <div className="pet-grid">
        {filteredPets.map((pet) => (
          <article className="pet-card reference-pet-card" key={pet.id}>
            <img src={pet.image} alt={pet.name} />
            <div className="pet-card-body">
              <h3>{pet.name}</h3>
              <p>{pet.type} · {pet.age}</p>
              <span>{pet.personality}</span>
              <div className="pet-card-footer">
                <small><Heart size={13} aria-hidden="true" /> {pet.contact}</small>
                <StatusBadge status={pet.status} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

