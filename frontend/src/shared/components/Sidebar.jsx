import { createElement } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  Heart,
  Home,
  LogOut,
  Search,
  Settings,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { clearSession } from '../api/httpClient.js';
import BrandMark from './BrandMark.jsx';

const navItems = [
  { to: '/app', label: 'Inicio', icon: Home, end: true },
  { to: '/app/educacion', label: 'Acciones responsables', icon: BookOpen },
  { to: '/app/salud', label: 'Salud y prevención', icon: Stethoscope },
  { to: '/app/mascotas-perdidas', label: 'Mascotas perdidas', icon: Search },
  { to: '/app/adopciones', label: 'Adopción', icon: Heart },
  { to: '/app/comunidad', label: 'Comunidad', icon: Users },
  { to: '/app/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/app/perfil', label: 'Perfil', icon: User },
  { to: '/app/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ isCollapsed }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <aside className="sidebar" id="app-sidebar">
      <BrandMark compact={isCollapsed} />
      <nav className="sidebar-nav" aria-label="Navegacion principal">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
            {createElement(item.icon, { size: 20, 'aria-hidden': true })}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-button" type="button" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </aside>
  );
}
