import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../shared/api/vetchainApi.js';
import BrandMark from '../../../shared/components/BrandMark.jsx';

const socialProviders = [
  { label: 'Facebook', shortLabel: 'f' },
  { label: 'Google', shortLabel: 'G' },
  { label: 'LinkedIn', shortLabel: 'in' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.login(credentials);
      navigate('/app');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <aside className="auth-welcome-panel">
        <div className="welcome-brand">
          <BrandMark />
        </div>
        <div className="welcome-copy">
          <h1>Bienvenido</h1>
          <h2>Ingresa</h2>
          <p>Estas a un paso del panel comunitario de PetChain.</p>
        </div>
      </aside>

      <div className="auth-form-panel">
        <header className="login-header">
          <h1>Iniciar sesion</h1>
          <p>Accede con tus credenciales para continuar.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Correo electronico</span>
            <div className="login-input">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="usuario@gmail.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="login-field">
            <span>Contrasena</span>
            <div className="login-input">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="********"
                autoComplete="current-password"
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                title={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </label>

          <div className="login-options">
            <label className="remember-check">
              <input type="checkbox" />
              <span>Mantener sesion iniciada</span>
            </label>
            <a className="forgot-link" href="#recuperar">
              Olvidaste tu contrasena?
            </a>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="button button-primary login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>


        <p className="signup-copy">
          No tienes una cuenta? <Link to="/registro">Registrate</Link>
        </p>
      </div>
    </section>
  );
}
