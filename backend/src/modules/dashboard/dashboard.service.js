import { list } from '../../data/store.js';

export function getSummary() {
  return {
    savedPosts: 12,
    activeLostPets: list('lostPets').filter((pet) => pet.status === 'Activo').length,
    adoptionPets: list('adoptionPets').length,
    upcomingEvents: list('events').length,
  };
}

export function getActivity() {
  return [
    {
      id: 'activity_1',
      type: 'lost_pet',
      title: 'Reportaste una mascota perdida (Firulais).',
      dateLabel: 'Hace 2 horas',
    },
    {
      id: 'activity_2',
      type: 'article',
      title: 'Guardaste un articulo sobre nutricion.',
      dateLabel: 'Hace 1 dia',
    },
    {
      id: 'activity_3',
      type: 'event',
      title: 'Te inscribiste en el evento "Taller de tenencia responsable".',
      dateLabel: 'Hace 2 dias',
    },
    {
      id: 'activity_4',
      type: 'adoption',
      title: 'Publicaste una mascota en adopcion (Mishi).',
      dateLabel: 'Hace 3 dias',
    },
  ];
}

export function getDashboard() {
  return {
    summary: getSummary(),
    articles: list('articles').slice(0, 3),
    activity: getActivity(),
  };
}

