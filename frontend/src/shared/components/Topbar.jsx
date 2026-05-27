import { Bell, ChevronDown, Menu } from 'lucide-react';
import { getStoredSession } from '../api/httpClient.js';

export default function Topbar({ onToggleSidebar, isSidebarCollapsed, user }) {
  const resolvedUser = user ?? getStoredSession()?.user;
  const displayName = resolvedUser?.name ?? 'Usuario';
  const avatarUrl = resolvedUser?.avatarUrl ?? '';
  const initial = displayName.charAt(0).toUpperCase();

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
          <span className="avatar" aria-hidden="true">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} loading="lazy" />
            ) : (
              initial
            )}
          </span>
          <strong>{displayName}</strong>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
