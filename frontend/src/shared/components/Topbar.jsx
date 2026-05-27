import { Bell, ChevronDown, Menu } from 'lucide-react';

export default function Topbar({ onToggleSidebar, isSidebarCollapsed }) {
  return (
    <header className="topbar">
      <button
        className="icon-button topbar-menu"
        type="button"
        title="Abrir menú"
        onClick={onToggleSidebar}
        aria-expanded={!isSidebarCollapsed}
        aria-controls="app-sidebar"
      >
        <Menu size={21} aria-hidden="true" />
      </button>

      <div className="topbar-actions">
        <button className="icon-button" type="button" title="Ver notificaciones">
          <Bell size={19} aria-hidden="true" />
        </button>
        <div className="user-chip">
          <span className="avatar">A</span>
          <strong>Alonso</strong>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
