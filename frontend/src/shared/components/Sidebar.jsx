import { createElement } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  Heart,
  HeartHandshake,
  Home,
  LogOut,
  Search,
  ShieldCheck,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { clearSession, getStoredSession } from '../api/httpClient.js';
import BrandMark from './BrandMark.jsx';

const navItems = [
  { to: '/app', label: 'Inicio', icon: Home, end: true },
  { to: '/app/articulos', label: 'Artículos', icon: BookOpen },
  { to: '/app/mascotas-perdidas', label: 'Mascotas perdidas', icon: Search },
  { to: '/app/adopciones', label: 'Adopción', icon: Heart },
  { to: '/app/acciones', label: 'Acciones responsables', icon: Trophy },
  { to: '/app/comunidad', label: 'Comunidad', icon: Users },
  { to: '/app/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/app/fundaciones', label: 'Fundaciones', icon: HeartHandshake },
  { to: '/app/perfil', label: 'Perfil', icon: User },
];

export default function Sidebar({ isCollapsed, onNavigate }) {
  const navigate = useNavigate();
  const isAdmin = getStoredSession()?.user?.role === 'admin';
  const visibleItems = isAdmin
    ? [...navItems, { to: '/app/admin', label: 'Administración', icon: ShieldCheck }]
    : navItems;

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
          <NavLink key={item.to} to={item.to} end={item.end} className="nav-link" onClick={onNavigate}>
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
