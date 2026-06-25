import { Navigate, Route, Routes } from 'react-router-dom';
import ActionsPage from '../features/actions/pages/ActionsPage.jsx';
import ActionDetailPage from '../features/actions/pages/ActionDetailPage.jsx';
import AdminPage from '../features/admin/pages/AdminPage.jsx';
import AdoptionsPage from '../features/adoptions/pages/AdoptionsPage.jsx';
import AdoptionDetailPage from '../features/adoptions/pages/AdoptionDetailPage.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import CommunityPage from '../features/community/pages/CommunityPage.jsx';
import ArticleDetailPage from '../features/content/pages/ArticleDetailPage.jsx';
import ArticlesPage from '../features/content/pages/ArticlesPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import EventsPage from '../features/events/pages/EventsPage.jsx';
import EventDetailPage from '../features/events/pages/EventDetailPage.jsx';
import FoundationsPage from '../features/foundations/pages/FoundationsPage.jsx';
import LostPetsPage from '../features/lostPets/pages/LostPetsPage.jsx';
import LostPetDetailPage from '../features/lostPets/pages/LostPetDetailPage.jsx';
import ProfilePage from '../features/profile/pages/ProfilePage.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { getStoredSession } from '../shared/api/httpClient.js';
import ProtectedRoute from '../shared/components/ProtectedRoute.jsx';

function AppIndexRoute() {
  const isAdmin = getStoredSession()?.user?.role === 'admin';
  return isAdmin ? <Navigate to="/app/admin" replace /> : <DashboardPage />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/registro" element={<AuthLayout><RegisterPage /></AuthLayout>} />
      <Route path="/register" element={<Navigate to="/registro" replace />} />
      <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AppIndexRoute />} />
        <Route path="articulos" element={<ArticlesPage />} />
        <Route path="articulos/:id" element={<ArticleDetailPage />} />
        <Route path="educacion" element={<Navigate to="/app/articulos" replace />} />
        <Route path="salud" element={<ArticlesPage initialCategory="Salud" />} />
        <Route path="mascotas-perdidas" element={<LostPetsPage />} />
        <Route path="mascotas-perdidas/:id" element={<LostPetDetailPage />} />
        <Route path="adopciones" element={<AdoptionsPage />} />
        <Route path="adopciones/:id" element={<AdoptionDetailPage />} />
        <Route path="acciones" element={<ActionsPage />} />
        <Route path="acciones/:id" element={<ActionDetailPage />} />
        <Route path="comunidad" element={<CommunityPage />} />
        <Route path="eventos" element={<EventsPage />} />
        <Route path="eventos/:id" element={<EventDetailPage />} />
        <Route path="fundaciones" element={<FoundationsPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="configuracion" element={<Navigate to="/app/perfil" replace />} />
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage section="moderation" /></ProtectedRoute>} />
        <Route path="admin/publicaciones" element={<ProtectedRoute adminOnly><AdminPage section="publications" /></ProtectedRoute>} />
        <Route path="admin/comentarios" element={<ProtectedRoute adminOnly><AdminPage section="comments" /></ProtectedRoute>} />
        <Route path="admin/usuarios" element={<ProtectedRoute adminOnly><AdminPage section="users" /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
