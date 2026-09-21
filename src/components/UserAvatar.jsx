import {
  getAvatar,
  GOOGLE_AVATAR_ID,
  INITIAL_AVATAR_ID,
  PHOTO_AVATAR_ID,
} from "../utils/avatars";
import "./UserAvatar.css";

// Avatar do cliente, usado na Navbar e no perfil. Ordem de preferência:
// foto enviada → emoji escolhido → foto do Google → inicial do nome.
export default function UserAvatar({ user, profile, className = "" }) {
  const avatarId = profile?.avatarId;
  const avatar = getAvatar(avatarId);

  if (avatarId === PHOTO_AVATAR_ID && profile?.avatarPhoto) {
    return <img className={className} src={profile.avatarPhoto} alt="" />;
  }

  if (avatar) {
    return (
      <span
        className={`user-avatar-emoji ${className}`}
        style={{ backgroundColor: avatar.color }}
        aria-hidden="true"
      >
        {avatar.emoji}
      </span>
    );
  }

  // Mostra a foto quando o cliente pediu explicitamente, ou quando ele nunca
  // escolheu nada (aí a foto do Google é o melhor padrão disponível).
  const wantsPhoto = avatarId === GOOGLE_AVATAR_ID || !avatarId;
  if (wantsPhoto && avatarId !== INITIAL_AVATAR_ID && user?.photoURL) {
    return <img className={className} src={user.photoURL} alt="" />;
  }

  const initial = (profile?.name || user?.displayName || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return <span className={className}>{initial}</span>;
}
