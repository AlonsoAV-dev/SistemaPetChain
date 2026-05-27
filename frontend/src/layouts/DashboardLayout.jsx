import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../shared/components/Sidebar.jsx';
import Topbar from '../shared/components/Topbar.jsx';

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' is-collapsed' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <main className="main-area">
        <Topbar onToggleSidebar={handleToggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

