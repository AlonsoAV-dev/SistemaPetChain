import { getDashboard } from '../src/modules/dashboard/dashboard.service.js';
import { createLostPet, getLostPets } from '../src/modules/lostPets/lostPets.service.js';
import { login } from '../src/modules/auth/auth.service.js';

const session = login({
  email: 'alonso@vetchain.com',
  password: 'vetchain123',
});

if (!session.token || session.user.email !== 'alonso@vetchain.com') {
  throw new Error('Auth smoke test failed');
}

const dashboard = getDashboard();

if (!dashboard.summary || !Array.isArray(dashboard.articles)) {
  throw new Error('Dashboard smoke test failed');
}

const createdPet = createLostPet(
  {
    name: 'Demo',
    type: 'Perro',
    zone: 'Lima',
    lastSeen: 'Hoy',
    description: 'Caso de prueba',
  },
  session.user,
);

if (!getLostPets({ query: 'Demo' }).some((pet) => pet.id === createdPet.id)) {
  throw new Error('Lost pets smoke test failed');
}

console.log('Backend smoke test passed');
