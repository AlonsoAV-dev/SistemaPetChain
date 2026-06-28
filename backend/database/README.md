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
8. Ejecuta `005_article_sources.sql` y `006_articles_published_default.sql`.
9. Ejecuta `007_responsible_action_rewards.sql` para habilitar rangos de
   puntos, ranking mensual, premios y sorteos.
10. Ejecuta `008_fix_point_revocation_on_user_delete.sql`.
11. Ejecuta `009_animal_action_categories_and_threshold.sql`.
12. Ejecuta `010_raffle_threshold_and_seed_balances.sql`.
13. Ejecuta `011_sync_current_ranking_scores.sql`.

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

Si el proyecto ya estaba creado, no repitas el script inicial. Ejecuta las
migraciones pendientes en orden numerico. Son aditivas y conservan las
publicaciones existentes.

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
- En acciones responsables, el administrador asigna puntos dentro del rango
  de la categoria y justifica su decision.
- Un administrador no puede evaluar su propia accion responsable.
- Un rechazo requiere un motivo.
- Los puntos se acreditan una sola vez por revision y se revierten si la
  publicacion se edita o elimina.

## Puntos de acciones responsables

Los rangos se guardan en `public.responsible_action_point_rules`. El periodo
mensual usa 15 puntos y dos acciones aprobadas como requisitos iniciales.
Los administradores pueden cambiar estos valores desde la seccion
`Puntos y sorteos` de PetChain.

Puedes modificar un rango desde SQL Editor:

```sql
UPDATE public.responsible_action_point_rules
SET min_points = 20, max_points = 30
WHERE category = 'Rescate comprobado';
```
