import { Link, Outlet } from 'react-router-dom';
import BrandMark from '../shared/components/BrandMark.jsx';

export default function PublicLayout() {
  return (
    <main className="public-page">
      <header className="public-header">
        <Link className="public-brand-link" to="/login" aria-label="Ir a PetChain">
          <BrandMark />
        </Link>
        <nav className="public-actions" aria-label="Acceso">
          <Link className="button button-secondary" to="/login">Iniciar sesión</Link>
          <Link className="button button-primary" to="/registro">Crear cuenta</Link>
        </nav>
      </header>
      <div className="public-content">
        <Outlet />
      </div>
    </main>
  );
}
