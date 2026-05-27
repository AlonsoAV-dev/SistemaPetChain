import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';
import { lostPets } from '../../../shared/data/mockData.js';

export default function LostPetsPage() {
  const [query, setQuery] = useState('');

  const filteredPets = useMemo(() => {
    return lostPets.filter((pet) =>
      `${pet.name} ${pet.zone} ${pet.type}`.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  return (
    <section className="module-section">
      <header className="module-header">
        <div>
          <h1>Mascotas perdidas</h1>
          <p>Ayuda a encontrar a estas mascotas o reporta una si la has visto.</p>
        </div>
        <button className="button button-primary" type="button">
          <Plus size={18} aria-hidden="true" />
          Reportar mascota
        </button>
      </header>

      <label className="search-box module-search">
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, distrito o tipo"
        />
      </label>

      <div className="pet-grid">
        {filteredPets.map((pet) => (
          <article className="pet-card reference-pet-card" key={pet.id}>
            <img src={pet.image} alt={pet.name} />
            <div className="pet-card-body">
              <h3>{pet.name}</h3>
              <p>Perdido en {pet.zone}</p>
              <span>{pet.description}</span>
              <div className="pet-card-footer">
                <small>{pet.lastSeen}</small>
                <StatusBadge status={pet.status} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

