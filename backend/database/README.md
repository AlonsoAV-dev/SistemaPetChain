# Supabase Database y Storage

PetChain usa Supabase unicamente como PostgreSQL y almacenamiento de imagenes.
La autenticacion, los JWT, los roles y las reglas de negocio permanecen en
Express.

## Crear las tablas

1. Crea un proyecto en Supabase.
2. Abre `SQL Editor`.
3. Crea una consulta nueva.
4. Copia todo el contenido de `001_initial_schema.sql`.
5. Pulsa `Run`.
6. Ejecuta `003_interactions_and_galleries.sql` para habilitar galerias,
   solicitudes de adopcion, avistamientos y notificaciones.
7. Ejecuta `004_event_links.sql` para habilitar enlaces externos en eventos.

El script crea:

- usuarios propios de PetChain;
- publicaciones y sus tres tipos de detalle;
- moderacion previa obligatoria;
- historial de aprobaciones y rechazos;
- puntos, likes, favoritos y comentarios;
- articulos y eventos con enlaces externos opcionales;
- el bucket publico `petchain-media`, limitado a imagenes de 5 MB.

No utiliza Supabase Auth. La tabla `public.users` contiene el hash de
contrasena generado por Express.

## Cargar datos de demostracion

Despues de ejecutar `001_initial_schema.sql`, copia y ejecuta:

```txt
002_seed_demo.sql
```

Si el proyecto ya estaba creado, no repitas el script inicial: ejecuta
solamente `003_interactions_and_galleries.sql` y luego `004_event_links.sql`.
Ambos scripts son aditivos y conservan las publicaciones existentes.

Credenciales:

```txt
Administrador: admin@petchain.test / AdminPet123
Usuario:       ana@petchain.test   / UsuarioPet123
Usuario:       mario@petchain.test / UsuarioPet123
```

El seed puede ejecutarse nuevamente sin duplicar sus registros.

## Seguridad

Las tablas se revocan para los roles `anon` y `authenticated`. React no debe
usar la Data API de Supabase. Todas las consultas pasan por Express usando
`DATABASE_URL`.

Storage se usa desde Express con `SUPABASE_SECRET_KEY`. Esa clave no debe
guardarse en variables `VITE_*`, publicarse en Git ni enviarse al navegador.

## Primer administrador

Registra primero una cuenta desde PetChain. Despues ejecuta en SQL Editor:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'tu-correo@ejemplo.com';
```

Al volver a iniciar sesion, el nuevo JWT incluira el rol administrativo.

## Moderacion

- Toda publicacion nueva empieza como `pending`.
- Los listados publicos solo muestran publicaciones `approved`.
- El propietario puede editar unicamente sus publicaciones.
- Una publicacion editada despues de aprobarse vuelve a `pending`.
- Un administrador no tiene endpoints para editar contenido.
- El administrador solo aprueba o rechaza mediante
  `public.review_publication(...)`.
- Un rechazo requiere un motivo.
- Los puntos se procesan una sola vez por publicacion.

## Puntos iniciales

| Publicacion | Puntos |
| --- | ---: |
| Mascota perdida | 5 |
| Adopcion | 10 |
| Accion responsable | 20 |

Hay un limite de tres publicaciones premiadas por usuario al dia. Puedes
cambiar los valores desde SQL Editor:

```sql
UPDATE public.point_rules
SET points = 25
WHERE publication_type = 'responsible_action';
```
