import { createElement } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  FileText,
  Heart,
  HeartHandshake,
  Home,
  LogOut,
  MessageCircle,
  Search,
  ShieldCheck,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { clearSession, getStoredSession } from '../api/httpClient.js';
import BrandMark from './BrandMark.jsx';

const userNavItems = [
  { to: '/app', label: 'Inicio', icon: Home, end: true },
  { to: '/app/adopciones', label: 'Adopción', icon: Heart },
  { to: '/app/mascotas-perdidas', label: 'Mascotas perdidas', icon: Search },
  { to: '/app/acciones', label: 'Acciones responsables', icon: Trophy },
  { to: '/app/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/app/articulos', label: 'Artículos', icon: BookOpen },
  { to: '/app/fundaciones', label: 'Fundaciones', icon: HeartHandshake },
  { to: '/app/perfil', label: 'Perfil', icon: User },
];

const adminNavItems = [
  { to: '/app/admin', label: 'Panel Admin', icon: ShieldCheck, end: true },
  { to: '/app/admin/publicaciones', label: 'Publicaciones', icon: FileText },
  { to: '/app/admin/comentarios', label: 'Comentarios', icon: MessageCircle },
  { to: '/app/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/app/articulos', label: 'Artículos', icon: BookOpen },
  { to: '/app/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/app/fundaciones', label: 'Fundaciones', icon: HeartHandshake },
  { to: '/app/perfil', label: 'Perfil', icon: User },
];

export default function Sidebar({ isCollapsed, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = getStoredSession()?.user?.role === 'admin';
  const visibleItems = isAdmin ? adminNavItems : userNavItems;

  function isItemActive(item) {
    const targetPath = item.to.split('?')[0];

    if (item.end) return location.pathname === targetPath;

    return location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
  }

  function handleLogout() {
    onNavigate?.();
    clearSession();
    navigate('/login');
  }

  return (
    <aside className="sidebar" id="app-sidebar">
      <BrandMark compact={isCollapsed} />
      <nav className="sidebar-nav" aria-label="Navegación principal">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={() => `nav-link${isItemActive(item) ? ' active' : ''}`}
            onClick={onNavigate}
          >
            {createElement(item.icon, { size: 20, 'aria-hidden': true })}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-button" type="button" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
