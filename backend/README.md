# Backend PetChain

API REST para el MVP de PetChain. Express gestiona autenticacion, autorizacion y
reglas de negocio; Supabase se utiliza como PostgreSQL y Storage.

## Stack

- Node.js
- Express
- PostgreSQL mediante `pg`
- Supabase Storage
- JWT HS256 con emisor, audiencia y expiracion
- PBKDF2 para contrasenas
- Helmet y rate limiting
- Moderacion y puntos gestionados en PostgreSQL

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

## Base de datos PostgreSQL

La migracion inicial esta en:

```txt
database/001_initial_schema.sql
```

Incluye usuarios, publicaciones, moderacion administrativa, propiedad de
contenido, puntos, articulos, eventos y el bucket de Storage. Las instrucciones
estan en `database/README.md` y `../docs/SUPABASE.md`.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/001_initial_schema.sql
```

## Credenciales demo

Ya no se cargan credenciales demo. Registra una cuenta y promocionala a
administrador siguiendo `../docs/SUPABASE.md`.

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

## Deploy en Vercel

Esta carpeta ya incluye configuracion para Vercel:

- `vercel.json`
- `api/index.js` (entrypoint serverless de Express)

Variables requeridas en el proyecto de backend en Vercel:

```txt
DATABASE_URL=<transaction-pooler-uri>
DATABASE_SSL=true
DATABASE_POOL_MAX=5
AUTH_SECRET=<valor-seguro>
CORS_ORIGINS=https://tu-frontend.vercel.app,https://otro-dominio.com
AUTH_TOKEN_TTL_SECONDS=86400
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=<clave-secreta>
SUPABASE_STORAGE_BUCKET=petchain-media
```

Si `CORS_ORIGINS` queda vacio, el backend permite cualquier origen. Para produccion conviene definir tu lista explicita.

No coloques `SUPABASE_SECRET_KEY` en el frontend. `VITE_API_URL` siempre debe
apuntar al backend Express.
