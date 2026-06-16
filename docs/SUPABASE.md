# Configurar Supabase en PetChain

Supabase se utiliza para dos servicios:

1. PostgreSQL.
2. Storage.

Express continua siendo el backend y emite sus propios JWT.

## 1. Ejecutar el SQL

En el panel del proyecto:

```txt
SQL Editor > New query
```

Copia y ejecuta:

```txt
backend/database/001_initial_schema.sql
```

Si quieres datos de demostracion, ejecuta despues:

```txt
backend/database/002_seed_demo.sql
```

Luego ejecuta:

```txt
backend/database/003_interactions_and_galleries.sql
backend/database/004_event_links.sql
```

El script `003` anade galerias, solicitudes de adopcion, reportes con
evidencias y notificaciones. El script `004` anade enlaces externos para
eventos, como TikTok, Instagram, lives o formularios.

El mensaje final debe indicar que la consulta se ejecuto correctamente. En
`Table Editor` apareceran las tablas y en `Storage` aparecera
`petchain-media`.

## 2. Obtener DATABASE_URL

Pulsa `Connect` en la parte superior del proyecto.

Para Vercel u otro entorno serverless selecciona:

```txt
Transaction pooler
```

Copia la URI. Su formato aproximado es:

```txt
postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres
```

Guardala en el backend:

```env
DATABASE_URL=postgresql://...
DATABASE_SSL=true
DATABASE_POOL_MAX=5
```

La conexion directa `db.PROJECT_REF.supabase.co:5432` suele requerir IPv6. Para
desarrollo local puedes usar `Session pooler`; para Vercel usa `Transaction
pooler`.

## 3. Obtener la URL y la clave de Storage

En:

```txt
Project Settings > API Keys
```

Configura:

```env
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_STORAGE_BUCKET=petchain-media
```

En proyectos que todavia muestran claves heredadas, `service_role` cumple la
misma funcion de servidor. Prefiere una `Secret key` nueva cuando este
disponible.

`SUPABASE_URL` es la URL del proyecto, no la URL de conexion PostgreSQL.
`SUPABASE_SECRET_KEY` existe unicamente en el backend.

## 4. URLs utilizadas por cada aplicacion

Backend Express:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Frontend React local:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Frontend React desplegado:

```env
VITE_API_URL=https://TU-BACKEND.vercel.app/api/v1
```

React no debe apuntar a `PROJECT_REF.supabase.co`, porque las tablas y Storage
se administran a traves de Express.

## 5. Variables completas del backend

Parte de `backend/.env.example` y crea `backend/.env`. Usa un secreto JWT largo
y aleatorio:

```powershell
@'
const { randomBytes } = require('node:crypto');
console.log(randomBytes(48).toString('hex'));
'@ | node
```

Pega el resultado en `AUTH_SECRET`.

## 6. Crear el administrador

1. Inicia backend y frontend.
2. Registra tu cuenta.
3. Ejecuta en SQL Editor:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'tu-correo@ejemplo.com';
```

4. Cierra sesion e inicia sesion nuevamente.

## 7. Comprobar la conexion

Con el backend iniciado:

```txt
GET http://localhost:3000/health
```

Debe responder `status: ok` junto con `databaseTime`.

La subida de imagenes usa:

```txt
POST /api/v1/media/images
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
Campo de archivo: image
Campo opcional: folder (avatars, publications o evidence)
```
