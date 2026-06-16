import { Navigate, useLocation } from 'react-router-dom';
import { getStoredSession } from '../api/httpClient.js';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const session = getStoredSession();

  if (!session?.token || !session?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && session.user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return children;
}
