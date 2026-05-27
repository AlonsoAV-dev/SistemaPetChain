# Backend VetChain

API REST para el MVP de VetChain. La primera version usa datos en memoria para avanzar rapido con el frontend y deja la estructura lista para conectar PostgreSQL, Supabase o Prisma despues.

## Stack

- Node.js
- Express
- CORS propio
- Carga simple de `.env` sin dependencias externas
- Autenticacion con token firmado HMAC
- Datos semilla en memoria

## Ejecutar

```bash
cd backend
npm install
npm run dev
```

La API queda disponible en:

```bash
http://localhost:3000
```

## Credenciales demo

```txt
email: valeria@vetchain.org
password: vetchain123
```

## Endpoints principales

```txt
GET    /health
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/auth/me

GET    /api/v1/dashboard
GET    /api/v1/dashboard/summary
GET    /api/v1/dashboard/activity

GET    /api/v1/lost-pets
POST   /api/v1/lost-pets
PATCH  /api/v1/lost-pets/:id

GET    /api/v1/adoptions
POST   /api/v1/adoptions
PATCH  /api/v1/adoptions/:id

GET    /api/v1/responsible-actions
POST   /api/v1/responsible-actions
POST   /api/v1/responsible-actions/:id/like

GET    /api/v1/articles
GET    /api/v1/events
POST   /api/v1/events

GET    /api/v1/admin/moderation
PATCH  /api/v1/admin/moderation/:id
```

Las rutas `POST`, `PATCH`, `/auth/me`, eventos privados y administracion requieren:

```txt
Authorization: Bearer <token>
```

## Siguiente paso

Reemplazar `src/data/store.js` por una capa de persistencia real:

- Supabase Auth para usuarios,
- PostgreSQL para tablas,
- politicas por rol,
- subida de imagenes a Supabase Storage.
