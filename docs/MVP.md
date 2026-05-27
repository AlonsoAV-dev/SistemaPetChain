# MVP PetChain

## Alcance inicial

El sistema interno del MVP se enfoca en validar el flujo comunitario principal:

- acceso al sistema,
- tablero de resumen,
- registro y seguimiento de mascotas perdidas,
- publicacion de mascotas en adopcion,
- acciones responsables con puntos,
- administracion basica para moderar publicaciones.

## Modulos

### Autenticacion

Pantalla de ingreso preparada para conectarse luego con Supabase Auth o un backend propio.

### Panel principal

Vista de control con indicadores, publicaciones urgentes, actividad reciente y proximas campanas.

### Mascotas perdidas

Registro local de mascotas, filtros por estado y tarjetas con informacion de contacto.

### Adopciones

Listado de mascotas disponibles y formulario para crear publicaciones de adopcion.

### Acciones responsables

Feed comunitario donde cada buena accion puede sumar puntos y recibir interacciones.

### Administracion

Cola de moderacion, metricas rapidas y acciones basicas de aprobacion o revision.

## Siguiente paso tecnico

Conectar los servicios del frontend a Supabase:

- `auth.users` para usuarios,
- `lost_pets` para mascotas perdidas,
- `adoption_pets` para adopciones,
- `responsible_posts` para acciones responsables,
- `events` para campanas,
- `profiles` para roles y datos publicos.

