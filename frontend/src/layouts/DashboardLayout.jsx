import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { authApi } from '../shared/api/vetchainApi.js';
import { getStoredSession } from '../shared/api/httpClient.js';
import Sidebar from '../shared/components/Sidebar.jsx';
import Topbar from '../shared/components/Topbar.jsx';

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' is-collapsed' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <main className="main-area">
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          user={user}
        />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

