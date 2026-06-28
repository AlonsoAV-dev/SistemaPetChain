import { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Pencil, Save, X } from 'lucide-react';
import { authApi, mediaApi } from '../../../shared/api/vetchainApi.js';
import { getStoredSession } from '../../../shared/api/httpClient.js';
import LoadingState from '../../../shared/components/LoadingState.jsx';

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ProfilePage() {
  const storedUser = getStoredSession()?.user;
  const [profile, setProfile] = useState(() => storedUser ?? null);
  const [profileForm, setProfileForm] = useState(() => ({
    name: storedUser?.name ?? '',
    email: storedUser?.email ?? '',
    avatarUrl: storedUser?.avatarUrl ?? '',
  }));
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

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

    authApi.me().then((profileResult) => {
      if (!isMounted) return;
      setProfile(profileResult);
      setProfileForm({
        name: profileResult.name ?? '',
        email: profileResult.email ?? '',
        avatarUrl: profileResult.avatarUrl ?? '',
      });
    }).catch((apiError) => {
      if (isMounted) setError(apiError.message ?? 'No se pudo cargar el perfil.');
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function resetProfileForm() {
    setProfileForm({
      name: profile?.name ?? '',
      email: profile?.email ?? '',
      avatarUrl: profile?.avatarUrl ?? '',
    });
    setAvatarFile(null);
    setProfileMessage('');
    setError('');
  }

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
    if (!isEditingProfile) return;

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
      setIsEditingProfile(false);
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

  if (loading) return <LoadingState label="Cargando tu perfil..." />;

  return (
    <section className="profile-page">
      <header className="page-header profile-page-header">
        <div className="page-title">
          <h1>{profile?.name ? `Perfil de ${profile.name}` : 'Perfil'}</h1>
          <p>Gestiona tus datos personales y la seguridad de tu cuenta.</p>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="profile-layout">
        <section className="panel profile-card">
          <div className="profile-summary">
            <span className="avatar avatar-lg" aria-hidden="true">
              {avatarUrl ? <img src={avatarUrl} alt={displayName} loading="lazy" /> : initial}
            </span>
            <div>
              <strong>{displayName}</strong>
              <span>{profile?.email ?? '-'}</span>
              <small>{profile?.role ?? 'user'} · Desde {joinedDate}</small>
            </div>
          </div>

          {profileMessage && <p className="form-success">{profileMessage}</p>}

          <form className="profile-edit-form" onSubmit={handleProfileSubmit}>
            <div className="profile-panel-title">
              <div>
                <h2>Informacion personal</h2>
                <p>{isEditingProfile ? 'Edita y guarda tus cambios.' : 'Activa la edicion para modificar tus datos.'}</p>
              </div>
              {!isEditingProfile ? (
                <button className="button button-secondary" type="button" onClick={() => setIsEditingProfile(true)}>
                  <Pencil size={16} /> Editar perfil
                </button>
              ) : (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    resetProfileForm();
                    setIsEditingProfile(false);
                  }}
                >
                  <X size={16} /> Cancelar
                </button>
              )}
            </div>

            <div className="profile-form-grid">
              <label className="field">
                <span>Nombre</span>
                <input
                  className="input"
                  name="name"
                  required
                  minLength={2}
                  disabled={!isEditingProfile}
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
                  disabled={!isEditingProfile}
                  value={profileForm.email}
                  onChange={handleProfileInput}
                />
              </label>
              <label className="field">
                <span>Rol</span>
                <input className="input" value={profile?.role ?? 'user'} disabled />
              </label>
              <label className="field">
                <span>Miembro desde</span>
                <input className="input" value={joinedDate} disabled />
              </label>
              <label className="field">
                <span>Subir avatar</span>
                <input className="input" type="file" accept="image/*" disabled={!isEditingProfile} onChange={handleAvatarFileChange} />
              </label>
              <label className="field">
                <span>URL de avatar</span>
                <input
                  className="input"
                  name="avatarUrl"
                  disabled={!isEditingProfile}
                  value={profileForm.avatarUrl}
                  onChange={handleProfileInput}
                  placeholder="https://"
                />
              </label>
            </div>

            {isEditingProfile && (
              <button className="button button-primary profile-save-button" type="submit" disabled={isSavingProfile}>
                <Save size={16} /> {isSavingProfile ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </form>
        </section>

        <aside className="profile-side-column">
          <section className="panel password-card">
            <div className="profile-panel-title compact">
              <div>
                <h2>Cambiar contrasena</h2>
                <p>Usa tu contrasena actual para validar el cambio.</p>
              </div>
              <LockKeyhole size={20} aria-hidden="true" />
            </div>
            {passwordMessage && <p className="form-success">{passwordMessage}</p>}
            <form className="compact-form" onSubmit={handlePasswordSubmit}>
              <label className="field">
                <span>Actual</span>
                <input className="input" name="currentPassword" type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={handlePasswordInput} />
              </label>
              <label className="field">
                <span>Nueva</span>
                <input className="input" name="newPassword" type="password" autoComplete="new-password" required minLength={8} value={passwordForm.newPassword} onChange={handlePasswordInput} />
              </label>
              <label className="field">
                <span>Confirmar</span>
                <input className="input" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} value={passwordForm.confirmPassword} onChange={handlePasswordInput} />
              </label>
              <button className="button button-primary" type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Actualizando...' : 'Cambiar contrasena'}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </section>
  );
}
