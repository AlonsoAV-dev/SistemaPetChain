import { Navigate, useLocation } from 'react-router-dom';
import { getStoredSession } from '../api/httpClient.js';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const session = getStoredSession();

  if (!session?.token || !session?.user) {
    const publicPath = location.pathname.match(/^\/app\/(adopciones|mascotas-perdidas|acciones)\/([^/]+)$/);

    if (publicPath) {
      return <Navigate to={`/${publicPath[1]}/${publicPath[2]}${location.search}`} replace />;
    }

    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (adminOnly && session.user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return children;
}
