import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import LostPetsPage from '../features/lostPets/pages/LostPetsPage.jsx';
import AdoptionsPage from '../features/adoptions/pages/AdoptionsPage.jsx';
import ActionsPage from '../features/actions/pages/ActionsPage.jsx';
import AdminPage from '../features/admin/pages/AdminPage.jsx';
import ProfilePage from '../features/profile/pages/ProfilePage.jsx';
import ComingSoon from '../shared/components/ComingSoon.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="/registro"
        element={
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        }
      />
      <Route path="/register" element={<Navigate to="/registro" replace />} />
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="educacion" element={<ActionsPage />} />
        <Route
          path="salud"
          element={<ComingSoon title="Salud y prevencion" />}
        />
        <Route path="mascotas-perdidas" element={<LostPetsPage />} />
        <Route path="adopciones" element={<AdoptionsPage />} />
        <Route path="acciones" element={<ActionsPage />} />
        <Route path="comunidad" element={<ComingSoon title="Comunidad" />} />
        <Route path="eventos" element={<ComingSoon title="Eventos" />}
        />
        <Route path="perfil" element={<ProfilePage />} />
        <Route
          path="configuracion"
          element={<ComingSoon title="Configuracion" />}
        />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
