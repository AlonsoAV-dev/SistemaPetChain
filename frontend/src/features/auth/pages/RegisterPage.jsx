import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../shared/api/vetchainApi.js';
import BrandMark from '../../../shared/components/BrandMark.jsx';

const socialProviders = [
  { label: 'Facebook', shortLabel: 'f' },
  { label: 'Google', shortLabel: 'G' },
  { label: 'LinkedIn', shortLabel: 'in' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.register(form);
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
          <h2>Registrate</h2>
          <p>Crea tu cuenta para participar en acciones, adopciones y reportes.</p>
        </div>
      </aside>

      <div className="auth-form-panel">
        <header className="login-header">
          <h1>Crear cuenta</h1>
          <p>Completa tus datos para unirte a PetChain.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Nombre completo</span>
            <div className="login-input">
              <UserRound size={18} aria-hidden="true" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Alonso Almerco"
                autoComplete="name"
              />
            </div>
          </label>

          <label className="login-field">
            <span>Correo electronico</span>
            <div className="login-input">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@petchain.org"
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
                value={form.password}
                onChange={handleChange}
                placeholder="********"
                autoComplete="new-password"
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

          {error && <p className="form-error">{error}</p>}

          <button className="button button-primary login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
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
          Ya tienes una cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </div>
    </section>
  );
}
