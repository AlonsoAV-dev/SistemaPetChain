import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BrandMark from '../../../shared/components/BrandMark.jsx';

const socialProviders = [
  { label: 'Facebook', shortLabel: 'f' },
  { label: 'Google', shortLabel: 'G' },
  { label: 'LinkedIn', shortLabel: 'in' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    navigate('/app');
  }

  return (
    <section className="auth-card">
      <aside className="auth-welcome-panel">
        <div className="welcome-brand">
          <BrandMark />
        </div>
        <div className="welcome-copy">
          <h1>¡Bienvenido!</h1>
          <h2>Regístrate</h2>
          <p>Crea tu cuenta para participar en acciones, adopciones y reportes.</p>
        </div>
      </aside>

      <div className="auth-form-panel">
        <header className="login-header">
          <h1>Crear cuenta</h1>
          <p>Completa tus datos para unirte a VetChain.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Nombre completo</span>
            <div className="login-input">
              <UserRound size={18} aria-hidden="true" />
              <input type="text" placeholder="Alonso Almerco" autoComplete="name" />
            </div>
          </label>

          <label className="login-field">
            <span>Correo electrónico</span>
            <div className="login-input">
              <Mail size={18} aria-hidden="true" />
            <input type="email" placeholder="correo@vetchain.org" autoComplete="email" />
            </div>
          </label>

          <label className="login-field">
            <span>Contraseña</span>
            <div className="login-input">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </label>

          <button className="button button-primary login-submit" type="submit">
            Crear cuenta
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>

        <div className="login-divider">
          <span>o usa redes sociales para registrarte</span>
        </div>

        <div className="social-row" aria-label="Opciones de registro social">
          {socialProviders.map((provider) => (
            <button
              className="social-button"
              type="button"
              key={provider.label}
              aria-label={`Registrarse con ${provider.label}`}
              title={`Registrarse con ${provider.label}`}
            >
              {provider.shortLabel}
            </button>
          ))}
        </div>

        <p className="signup-copy">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </section>
  );
}
