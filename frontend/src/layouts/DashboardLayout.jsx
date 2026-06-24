import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../shared/api/vetchainApi.js';
import { getStoredSession } from '../shared/api/httpClient.js';
import Sidebar from '../shared/components/Sidebar.jsx';
import Topbar from '../shared/components/Topbar.jsx';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => getStoredSession()?.user ?? null);

  useEffect(() => {
    let isMounted = true;

    authApi
      .me()
      .then((data) => {
        if (isMounted) setUser(data);
      })
      .catch((error) => {
        console.warn('No se pudo cargar el perfil del usuario:', error.message);
        if (/token|autenticacion|usuario no disponible/i.test(error.message)) {
          navigate('/login', { replace: true });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }

    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' is-collapsed' : ''}${isMobileSidebarOpen ? ' is-mobile-sidebar-open' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} onNavigate={() => setIsMobileSidebarOpen(false)} />
      {isMobileSidebarOpen && (
        <button
          className="mobile-sidebar-backdrop"
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <main className="main-area">
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isMobileSidebarOpen || !isSidebarCollapsed}
          user={user}
        />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

