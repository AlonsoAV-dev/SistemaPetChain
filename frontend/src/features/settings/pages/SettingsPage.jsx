import { LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getStoredSession } from '../../../shared/api/httpClient.js';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = getStoredSession()?.user;

  function logout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <section className="module-section">
      <header className="module-header"><div><h1>Configuración</h1><p>Información de sesión y seguridad de la cuenta.</p></div></header>
      <section className="panel settings-card">
        <div className="section-heading"><ShieldCheck size={22} /><h2>Sesión activa</h2></div>
        <div className="settings-grid"><div><span>Usuario</span><strong>{user?.name}</strong></div><div><span>Correo</span><strong>{user?.email}</strong></div><div><span>Rol</span><strong>{user?.role}</strong></div></div>
        <p className="muted-copy">La sesión utiliza un JWT emitido por Express.</p>
        <button className="button button-danger" type="button" onClick={logout}><LogOut size={17} /> Cerrar sesión</button>
      </section>
    </section>
  );
}
