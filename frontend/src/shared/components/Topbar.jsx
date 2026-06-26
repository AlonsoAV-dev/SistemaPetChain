import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getStoredSession } from '../api/httpClient.js';
import { interactionsApi } from '../api/vetchainApi.js';

export default function Topbar({ onToggleSidebar, isSidebarOpen, user }) {
  const navigate = useNavigate();
  const resolvedUser = user ?? getStoredSession()?.user;
  const displayName = resolvedUser?.name ?? 'Usuario';
  const avatarUrl = resolvedUser?.avatarUrl ?? '';
  const initial = displayName.charAt(0).toUpperCase();
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    interactionsApi.notifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    function closeProfileMenu(event) {
      if (event.key === 'Escape' || (event.type === 'mousedown' && !profileMenuRef.current?.contains(event.target))) {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', closeProfileMenu);
    document.addEventListener('keydown', closeProfileMenu);
    return () => {
      document.removeEventListener('mousedown', closeProfileMenu);
      document.removeEventListener('keydown', closeProfileMenu);
    };
  }, []);

  const unread = notifications.filter((item) => !item.read).length;

  async function openNotification(notification) {
    if (!notification.read) {
      await interactionsApi.markNotificationRead(notification.id);
      setNotifications((items) =>
        items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    }
    setNotificationsOpen(false);
    navigate(notification.path || '/app');
  }

  function viewProfile() {
    setProfileOpen(false);
    navigate('/app/perfil');
  }

  function logout() {
    setProfileOpen(false);
    clearSession();
    navigate('/login');
  }

  return (
    <header className="topbar">
      <button
        className="icon-button topbar-menu"
        type="button"
        title="Abrir menú"
        onClick={onToggleSidebar}
        aria-expanded={isSidebarOpen}
        aria-controls="app-sidebar"
      >
        <Menu size={21} aria-hidden="true" />
      </button>

      <div className="topbar-actions">
        <div className="notification-wrap">
          <button className="icon-button" type="button" title="Ver notificaciones" onClick={() => { setProfileOpen(false); setNotificationsOpen((value) => !value); }}>
            <Bell size={19} aria-hidden="true" />
            {unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {notificationsOpen && (
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
        <div className="profile-menu-wrap" ref={profileMenuRef}>
          <button
            className="user-chip"
            type="button"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => { setNotificationsOpen(false); setProfileOpen((value) => !value); }}
          >
            <span className="avatar" aria-hidden="true">
              {avatarUrl ? <img src={avatarUrl} alt="" loading="lazy" /> : initial}
            </span>
            <strong>{displayName}</strong>
            <ChevronDown className={profileOpen ? 'is-open' : ''} size={15} aria-hidden="true" />
          </button>
          {profileOpen && (
            <div className="profile-menu" role="menu">
              <button type="button" role="menuitem" onClick={viewProfile}><User size={17} /> Ver perfil</button>
              <button className="danger" type="button" role="menuitem" onClick={logout}><LogOut size={17} /> Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
