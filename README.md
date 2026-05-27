# 🐾 PetChain

PetChain es una plataforma web comunitaria enfocada en promover la tenencia responsable y el bienestar animal mediante educación, participación social y herramientas digitales.

La plataforma permite a los usuarios:
- reportar mascotas perdidas,
- publicar mascotas en adopción,
- participar en campañas comunitarias,
- compartir acciones responsables,
- acceder a contenido educativo,
- y participar en sorteos mediante buenas acciones relacionadas con mascotas y medio ambiente.

---

# 🚀 Objetivo del Proyecto

El objetivo de PetChain es generar impacto social real mediante tecnología, incentivando el cuidado responsable de mascotas y la participación activa de la comunidad.

---

# 🌎 Relación con los ODS

## ODS Principal
- ODS 3: Salud y bienestar

## ODS Complementarios
- ODS 11: Ciudades y comunidades sostenibles
- ODS 12: Producción y consumo responsables

---

# 🛠️ Tecnologías Utilizadas

## Frontend
- React
- Vite
- TailwindCSS
- React Router DOM
- Axios
- React Hook Form
- Zustand / Context API

## Backend
- Node.js
- Express.js
- JWT Authentication
- PostgreSQL
- Supabase

## Herramientas
- Git & GitHub
- Postman
- Figma
- ESLint
- dotenv

---

# ✅ Estado actual del desarrollo

Se inició el MVP del sistema interno en la carpeta `frontend/`.

El sistema incluye:
- pantalla de acceso,
- panel operativo,
- módulo de mascotas perdidas,
- módulo de adopciones,
- módulo de acciones responsables,
- módulo administrativo básico,
- estructura de carpetas por funcionalidades.

## Ejecutar el frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en:

```bash
http://localhost:5173
```

---

# 🧩 Funcionalidades Principales

## 👤 Autenticación
- Registro de usuarios
- Inicio de sesión
- JWT Authentication
- Roles (admin / user)

## 🐶 Mascotas Perdidas
- Publicación de mascotas perdidas
- Información de contacto
- Ubicación
- Estado de búsqueda

## 🏠 Adopción Responsable
- Publicación de mascotas en adopción
- Información de vacunas
- Descripción y personalidad

## 🌱 Tenencia Responsable
Los usuarios podrán compartir acciones positivas relacionadas con:
- cuidado animal,
- reciclaje,
- adopciones,
- ayuda comunitaria,
- bienestar ambiental.

Estas publicaciones podrán:
- recibir likes,
- generar puntos,
- participar en sorteos,
- y formar parte del ranking comunitario.

## 📚 Blog Educativo
- artículos,
- consejos,
- campañas informativas.

## 🎉 Eventos y Campañas
- talleres,
- campañas de adopción,
- actividades comunitarias.

## 🛡️ Panel Administrativo
- gestión de usuarios,
- aprobación de publicaciones,
- moderación,
- gestión de eventos,
- estadísticas.

---

# 🏗️ Arquitectura del Proyecto

El proyecto utiliza:
- Clean Architecture
- principios SOLID
- arquitectura modular y escalable

---

# 📂 Estructura General

```bash
petchain/
│
├── frontend/
│
├── backend/
│
├── docs/
│
└── README.md
```

---

# ⚙️ Instalación del Proyecto

## 1. Clonar repositorio

```bash
git clone https://github.com/usuario/petchain.git
```

---

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 3. Backend

```bash
cd backend
npm install
npm run dev
```

---

# 🔐 Variables de Entorno

## Backend `.env`

```env
PORT=3000

DATABASE_URL=

JWT_SECRET=

SUPABASE_URL=

SUPABASE_KEY=
```

---

# 📊 Base de Datos

Principales tablas:
- users
- roles
- lost_pets
- adoption_pets
- responsible_posts
- comments
- favorites
- raffles
- events

---

# 🎯 Impacto Esperado

## Indicadores Digitales
- visitas a la plataforma,
- interacciones,
- usuarios registrados,
- publicaciones realizadas.

## Indicadores Comunitarios
- participación en campañas,
- acciones responsables compartidas,
- asistentes a talleres,
- alcance educativo.

---

# 👨‍💻 Equipo de Desarrollo

- Alonso Almerco

---

# 📌 Estado del Proyecto

🚧 En desarrollo

---

# 📄 Licencia

Este proyecto fue desarrollado con fines educativos y sociales.
