import { ExternalLink, HeartHandshake } from 'lucide-react';

const foundations = [
  {
    name: 'Fundacion Camino a Casa',
    url: 'https://fundacioncaminoacasa.com/',
    initials: 'CC',
    description: 'Rescate, adopcion y apoyo a animales en situacion vulnerable.',
  },
  {
    name: 'WUF',
    url: 'https://www.wuf.pe/',
    initials: 'WF',
    description: 'Plataforma peruana que impulsa adopciones responsables.',
  },
  {
    name: 'Asociacion KP',
    url: 'https://asociacionkp.org/',
    initials: 'KP',
    description: 'Organizacion dedicada al bienestar y proteccion animal.',
  },
  {
    name: 'Patitas de Amor',
    url: 'https://patitasdeamor.com.pe/',
    initials: 'PA',
    description: 'Comunidad de ayuda, cuidado y adopcion responsable.',
  },
  {
    name: 'Fundacion Huellas Peru',
    url: 'https://www.instagram.com/fundacionhuellasperu/',
    initials: 'HP',
    description: 'Rescates y campanas difundidas desde Instagram.',
  },
];

export default function FoundationsPage() {
  return (
    <section className="module-section foundations-page">
      <header className="module-header">
        <div>
          <h1>Fundaciones</h1>
          <p>Organizaciones aliadas y recursos externos de rescate, adopcion y bienestar animal.</p>
        </div>
        <HeartHandshake size={30} aria-hidden="true" />
      </header>

      <div className="foundation-grid foundation-grid-page">
        {foundations.map((foundation) => (
          <a className="foundation-card" href={foundation.url} target="_blank" rel="noreferrer" key={foundation.url}>
            <span className="foundation-icon">{foundation.initials}</span>
            <span>
              <strong>{foundation.name}</strong>
              <small>{foundation.description}</small>
            </span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
