import { Bell, ChevronDown, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredSession } from '../api/httpClient.js';
import { interactionsApi } from '../api/vetchainApi.js';

export default function Topbar({ onToggleSidebar, isSidebarCollapsed, user }) {
  const navigate = useNavigate();
  const resolvedUser = user ?? getStoredSession()?.user;
  const displayName = resolvedUser?.name ?? 'Usuario';
  const avatarUrl = resolvedUser?.avatarUrl ?? '';
  const initial = displayName.charAt(0).toUpperCase();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    interactionsApi.notifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  const unread = notifications.filter((item) => !item.read).length;

  async function openNotification(notification) {
    if (!notification.read) {
      await interactionsApi.markNotificationRead(notification.id);
      setNotifications((items) =>
        items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    }
    setOpen(false);
    navigate(notification.path || '/app');
  }

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
        <div className="notification-wrap">
          <button className="icon-button" type="button" title="Ver notificaciones" onClick={() => setOpen((value) => !value)}>
            <Bell size={19} aria-hidden="true" />
            {unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {open && (
            <div className="notification-panel">
              <div className="notification-panel-header"><strong>Notificaciones</strong><span>{unread} nuevas</span></div>
              {notifications.length === 0 ? <p>No tienes notificaciones.</p> : notifications.slice(0, 10).map((notification) => (
                <button className={`notification-item${notification.read ? '' : ' unread'}`} type="button" key={notification.id} onClick={() => openNotification(notification)}>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{new Date(notification.createdAt).toLocaleString('es-PE')}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="user-chip">
          <span className="avatar" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" loading="lazy" /> : initial}
          </span>
          <strong>{displayName}</strong>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
