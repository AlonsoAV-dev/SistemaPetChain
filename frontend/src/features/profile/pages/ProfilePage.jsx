import { useEffect, useMemo, useState } from 'react';
import { authApi } from '../../../shared/api/vetchainApi.js';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import StatCard from '../../../shared/components/StatCard.jsx';

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => getStoredSession()?.user ?? null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarInput, setAvatarInput] = useState(() => getStoredSession()?.user?.avatarUrl ?? '');
  const displayName = profile?.name ?? 'Usuario';
  const avatarUrl = profile?.avatarUrl ?? '';
  const initial = displayName.charAt(0).toUpperCase();

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt) return '—';
    const date = new Date(profile.createdAt);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-PE');
  }, [profile?.createdAt]);

  useEffect(() => {
    let isMounted = true;
    setError('');

    authApi
      .me()
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleAvatarUrlChange(event) {
    setAvatarInput(event.target.value);
  }

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleAvatarSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const updatedProfile = await authApi.updateProfile({ avatarUrl: avatarInput });
      setProfile(updatedProfile);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="page-title">
          <h1>Perfil</h1>
          <p>Consulta tu informacion personal y estado dentro de VetChain.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Informacion personal</h2>
          <p>Estos datos se usan para tu identificacion dentro de la comunidad.</p>
        </div>

        <div className="profile-header">
          <span className="avatar avatar-lg" aria-hidden="true">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} loading="lazy" />
            ) : (
              initial
            )}
          </span>
          <div>
            <strong>{displayName}</strong>
            <span>{profile?.email ?? '—'}</span>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-stack">
          <label className="field">
            <span>Nombre</span>
            <input className="input" value={displayName} readOnly />
          </label>
          <label className="field">
            <span>Correo electronico</span>
            <input className="input" value={profile?.email ?? ''} readOnly />
          </label>
          <label className="field">
            <span>Rol</span>
            <input className="input" value={profile?.role ?? 'usuario'} readOnly />
          </label>
          <label className="field">
            <span>Miembro desde</span>
            <input className="input" value={joinedDate} readOnly />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Avatar</h2>
          <p>Sube una imagen o pega un enlace para actualizar tu perfil.</p>
        </div>

        <form className="form-stack" onSubmit={handleAvatarSubmit}>
          <label className="field">
            <span>Subir imagen</span>
            <input className="input" type="file" accept="image/*" onChange={handleAvatarFileChange} />
          </label>
          <label className="field">
            <span>URL de avatar</span>
            <input
              className="input"
              value={avatarInput}
              onChange={handleAvatarUrlChange}
              placeholder="https://"
            />
          </label>
          <button className="button button-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Actualizar avatar'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Resumen comunitario</h2>
          <p>Seguimiento rapido de tu participacion.</p>
        </div>
        <div className="stats-grid" style={{ marginTop: 24 }}>
          <StatCard label="Acciones registradas" value="—" />
          <StatCard label="Reportes activos" value="—" />
          <StatCard label="Adopciones" value="—" />
          <StatCard label="Eventos" value="—" />
        </div>
      </section>
    </>
  );
}
