import { useEffect, useMemo, useState } from 'react';
import {
  adoptionsApi,
  authApi,
  eventsApi,
  lostPetsApi,
  mediaApi,
  responsibleActionsApi,
} from '../../../shared/api/vetchainApi.js';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import StatCard from '../../../shared/components/StatCard.jsx';

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => getStoredSession()?.user ?? null);
  const [profileForm, setProfileForm] = useState(() => ({
    name: getStoredSession()?.user?.name ?? '',
    email: getStoredSession()?.user?.email ?? '',
    avatarUrl: getStoredSession()?.user?.avatarUrl ?? '',
  }));
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [summary, setSummary] = useState({
    actions: 0,
    lostPets: 0,
    adoptions: 0,
    events: 0,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const displayName = profile?.name ?? 'Usuario';
  const avatarUrl = profile?.avatarUrl ?? '';
  const initial = displayName.charAt(0).toUpperCase();

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt) return '-';
    const date = new Date(profile.createdAt);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-PE');
  }, [profile?.createdAt]);

  useEffect(() => {
    let isMounted = true;
    setError('');

    Promise.allSettled([
      authApi.me(),
      responsibleActionsApi.list(),
      lostPetsApi.list(),
      adoptionsApi.list(),
      eventsApi.list(),
    ]).then((results) => {
      if (!isMounted) return;

      const [
        profileResult,
        actionsResult,
        lostPetsResult,
        adoptionsResult,
        eventsResult,
      ] = results;

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
        setProfileForm({
          name: profileResult.value.name ?? '',
          email: profileResult.value.email ?? '',
          avatarUrl: profileResult.value.avatarUrl ?? '',
        });
      } else {
        setError(profileResult.reason?.message ?? 'No se pudo cargar el perfil.');
      }

      setSummary({
        actions: actionsResult.status === 'fulfilled' ? actionsResult.value.length : 0,
        lostPets: lostPetsResult.status === 'fulfilled' ? lostPetsResult.value.length : 0,
        adoptions: adoptionsResult.status === 'fulfilled' ? adoptionsResult.value.length : 0,
        events: eventsResult.status === 'fulfilled' ? eventsResult.value.length : 0,
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleProfileInput(event) {
    setProfileForm({ ...profileForm, [event.target.name]: event.target.value });
  }

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    setAvatarFile(file ?? null);
  }

  function handlePasswordInput(event) {
    setPasswordForm({ ...passwordForm, [event.target.name]: event.target.value });
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setError('');
    setProfileMessage('');
    setIsSavingProfile(true);

    try {
      const uploadedAvatarUrl = avatarFile
        ? (await mediaApi.uploadImage(avatarFile, 'avatars')).url
        : profileForm.avatarUrl;
      const updatedProfile = await authApi.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        avatarUrl: uploadedAvatarUrl,
      });

      setProfile(updatedProfile);
      setProfileForm({
        name: updatedProfile.name ?? '',
        email: updatedProfile.email ?? '',
        avatarUrl: updatedProfile.avatarUrl ?? '',
      });
      setAvatarFile(null);
      setProfileMessage('Perfil actualizado correctamente.');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError('');
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('La confirmacion no coincide con la nueva contrasena.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authApi.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordMessage('Contrasena actualizada correctamente.');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="page-title">
          <h1>{profile?.name ? `Perfil de ${profile.name}` : 'Perfil'}</h1>
          <p>Actualiza tus datos personales, avatar y contrasena.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Informacion personal</h2>
          <p>Estos datos se muestran dentro de la comunidad y se guardan en tu cuenta.</p>
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
            <span>{profile?.email ?? '-'}</span>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {profileMessage && <p className="form-success">{profileMessage}</p>}

        <form className="form-stack" onSubmit={handleProfileSubmit}>
          <label className="field">
            <span>Nombre</span>
            <input
              className="input"
              name="name"
              required
              minLength={2}
              value={profileForm.name}
              onChange={handleProfileInput}
            />
          </label>
          <label className="field">
            <span>Correo electronico</span>
            <input
              className="input"
              name="email"
              type="email"
              required
              value={profileForm.email}
              onChange={handleProfileInput}
            />
          </label>
          <label className="field">
            <span>Rol</span>
            <input className="input" value={profile?.role ?? 'user'} readOnly />
          </label>
          <label className="field">
            <span>Miembro desde</span>
            <input className="input" value={joinedDate} readOnly />
          </label>
          <label className="field">
            <span>Subir avatar</span>
            <input className="input" type="file" accept="image/*" onChange={handleAvatarFileChange} />
          </label>
          <label className="field">
            <span>URL de avatar</span>
            <input
              className="input"
              name="avatarUrl"
              value={profileForm.avatarUrl}
              onChange={handleProfileInput}
              placeholder="https://"
            />
          </label>
          <button className="button button-primary" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Cambiar contrasena</h2>
          <p>Por seguridad debes ingresar tu contrasena actual.</p>
        </div>

        {passwordMessage && <p className="form-success">{passwordMessage}</p>}

        <form className="form-stack" onSubmit={handlePasswordSubmit}>
          <label className="field">
            <span>Contrasena actual</span>
            <input
              className="input"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={passwordForm.currentPassword}
              onChange={handlePasswordInput}
            />
          </label>
          <label className="field">
            <span>Nueva contrasena</span>
            <input
              className="input"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={handlePasswordInput}
            />
          </label>
          <label className="field">
            <span>Confirmar nueva contrasena</span>
            <input
              className="input"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInput}
            />
          </label>
          <button className="button button-primary" type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? 'Actualizando...' : 'Cambiar contrasena'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Resumen comunitario</h2>
          <p>Seguimiento rapido de tu participacion.</p>
        </div>
        <div className="stats-grid" style={{ marginTop: 24 }}>
          <StatCard label="Acciones registradas" value={summary.actions} />
          <StatCard label="Reportes activos" value={summary.lostPets} />
          <StatCard label="Adopciones" value={summary.adoptions} />
          <StatCard label="Eventos" value={summary.events} />
        </div>
      </section>
    </>
  );
}
