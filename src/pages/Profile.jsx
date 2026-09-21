import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { useOrders } from "../hooks/useOrders";
import { saveUserProfile } from "../api/userProfile";
import { fetchAddressByCep, formatCep, onlyDigits } from "../api/cep";
import { useToast } from "../context/ToastContext";
import { useSeo } from "../hooks/useSeo";
import { getOrderStatus } from "../utils/orderStatus";
import {
  AVATARS,
  GOOGLE_AVATAR_ID,
  INITIAL_AVATAR_ID,
  PHOTO_AVATAR_ID,
} from "../utils/avatars";
import { fileToSquareDataUrl } from "../utils/imageResize";
import UserAvatar from "../components/UserAvatar";
import "./Profile.css";

const emptyAddress = {
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

// Pedidos nesses status contam como compra concretizada no total gasto.
const SOLD_STATUSES = ["paid", "shipped", "completed"];

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Campos sem os quais o cliente não consegue finalizar uma compra.
function isAddressComplete(address) {
  return ["zipCode", "street", "number", "neighborhood", "city", "state"].every((f) =>
    (address?.[f] || "").trim()
  );
}

export default function Profile() {
  useSeo({ title: "Meu Perfil", description: "Gerencie seus dados na SilBeauty." });

  const { currentUser, loading: authLoading, updateUserProfile, resetPassword, logout } = useAuth();
  const { profile } = useUserProfile(currentUser?.uid);
  const { orders } = useOrders(currentUser?.uid);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [avatarId, setAvatarId] = useState("");
  const [avatarPhoto, setAvatarPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  // Preenche os campos quando o perfil chega do Firebase. Feito na
  // renderização (padrão "ajustar estado quando a origem muda") para o
  // formulário não aparecer vazio por um instante antes de preencher.
  //
  // Só sincroniza uma vez por usuário: depois disso o que você está digitando
  // tem prioridade e não é sobrescrito por uma atualização do banco.
  const [syncedUid, setSyncedUid] = useState(null);

  if (currentUser && profile && syncedUid !== currentUser.uid) {
    setSyncedUid(currentUser.uid);
    setName(profile.name || currentUser.displayName?.split(" ")[0] || "");
    setSurname(profile.surname || "");
    setAddress({ ...emptyAddress, ...(profile.address || {}) });
    setAvatarId(profile.avatarId || "");
    setAvatarPhoto(profile.avatarPhoto || "");
  }

  if (!authLoading && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  function handleAddressChange(e) {
    const { name: field, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [field]: field === "state" ? value.toUpperCase() : value,
    }));
  }

  // Ao digitar o CEP completo, busca o endereço no ViaCEP e preenche o resto.
  async function handleCepChange(e) {
    const masked = formatCep(e.target.value);
    setAddress((prev) => ({ ...prev, zipCode: masked }));

    if (onlyDigits(masked).length !== 8) return;

    setLoadingCep(true);
    try {
      const found = await fetchAddressByCep(masked);
      if (!found) {
        showToast("CEP não encontrado. Preencha o endereço manualmente.", { type: "info" });
        return;
      }
      // Mantém número e complemento, que o ViaCEP não tem como saber.
      setAddress((prev) => ({ ...prev, ...found }));
      showToast("Endereço preenchido pelo CEP!", { type: "success" });
    } catch (err) {
      console.error("Erro ao consultar o CEP:", err);
      showToast("Não conseguimos consultar o CEP agora. Preencha manualmente.", { type: "info" });
    } finally {
      setLoadingCep(false);
    }
  }

  // A foto é recortada e reduzida no navegador antes de ir para o banco.
  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo novamente
    if (!file) return;

    setProcessingPhoto(true);
    try {
      const dataUrl = await fileToSquareDataUrl(file);
      setAvatarPhoto(dataUrl);
      setAvatarId(PHOTO_AVATAR_ID);
      showToast("Foto carregada! Clique em Salvar alterações para confirmar.", { type: "info" });
    } catch (err) {
      console.error(err);
      showToast(err.message || "Não conseguimos usar essa imagem.", { type: "error" });
    } finally {
      setProcessingPhoto(false);
    }
  }

  function handleRemovePhoto() {
    setAvatarPhoto("");
    if (avatarId === PHOTO_AVATAR_ID) setAvatarId(INITIAL_AVATAR_ID);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fullName = surname ? `${name} ${surname}` : name;
      await updateUserProfile({ displayName: fullName });
      await saveUserProfile(currentUser.uid, {
        name,
        surname,
        address,
        avatarId,
        // null remove o campo no Firebase (undefined causaria erro).
        avatarPhoto: avatarPhoto || null,
      });
      showToast("Perfil atualizado com sucesso!", { type: "success" });
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar perfil", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  // Troca de senha pelo fluxo seguro do Firebase: e-mail com link.
  async function handlePasswordReset() {
    setSendingReset(true);
    try {
      await resetPassword(currentUser.email);
      showToast(`Enviamos um link para ${currentUser.email} trocar sua senha.`, {
        type: "success",
        duration: 6000,
      });
    } catch (err) {
      console.error(err);
      showToast("Não conseguimos enviar o e-mail agora. Tente novamente.", { type: "error" });
    } finally {
      setSendingReset(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  if (!currentUser) return null;

  // Resumo da conta
  const soldOrders = orders.filter((o) => SOLD_STATUSES.includes(getOrderStatus(o)));
  const totalSpent = soldOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const memberSince = currentUser.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : null;
  const addressComplete = isAddressComplete(address);

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1>Meu perfil</h1>
        <Link to="/meus-pedidos" className="btn btn-ghost">
          📦 Meus pedidos
        </Link>
      </div>

      <div className="profile-summary">
        <div className="profile-summary-item">
          <span>Pedidos</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="profile-summary-item">
          <span>Total em compras</span>
          <strong>{formatPrice(totalSpent)}</strong>
        </div>
        {memberSince && (
          <div className="profile-summary-item">
            <span>Cliente desde</span>
            <strong className="profile-member-since">{memberSince}</strong>
          </div>
        )}
      </div>

      {!addressComplete && (
        <p className="profile-address-warning">
          ⚠️ Complete seu endereço de entrega abaixo — ele é obrigatório para finalizar compras.
        </p>
      )}

      <div className="profile-card">
        <div className="profile-identity">
          <div className="profile-avatar">
            <UserAvatar
              user={currentUser}
              profile={{ ...profile, avatarId, avatarPhoto, name }}
            />
          </div>
          <strong className="profile-identity-name">
            {surname ? `${name} ${surname}` : name || "Sem nome"}
          </strong>
          <span className="profile-identity-email">{currentUser.email}</span>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <h3 className="profile-section-title profile-section-first">Escolha seu avatar</h3>

          <div className="avatar-picker">
            {avatarPhoto ? (
              <button
                type="button"
                className={`avatar-option avatar-option-photo ${
                  avatarId === PHOTO_AVATAR_ID ? "selected" : ""
                }`}
                onClick={() => setAvatarId(PHOTO_AVATAR_ID)}
                title="Usar a minha foto"
              >
                <img src={avatarPhoto} alt="" />
              </button>
            ) : (
              <label
                className="avatar-option avatar-option-upload"
                title="Enviar uma foto minha"
              >
                {processingPhoto ? "…" : "📷"}
                <input type="file" accept="image/*" onChange={handlePhotoSelect} hidden />
              </label>
            )}

            {currentUser.photoURL && (
              <button
                type="button"
                className={`avatar-option avatar-option-photo ${
                  avatarId === GOOGLE_AVATAR_ID ? "selected" : ""
                }`}
                onClick={() => setAvatarId(GOOGLE_AVATAR_ID)}
                title="Usar a foto da minha conta Google"
              >
                <img src={currentUser.photoURL} alt="" />
              </button>
            )}

            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                className={`avatar-option ${avatarId === avatar.id ? "selected" : ""}`}
                style={{ backgroundColor: avatar.color }}
                onClick={() => setAvatarId(avatar.id)}
                title={avatar.label}
                aria-label={avatar.label}
              >
                {avatar.emoji}
              </button>
            ))}

            <button
              type="button"
              className={`avatar-option avatar-option-initial ${
                avatarId === INITIAL_AVATAR_ID || (!avatarId && !currentUser.photoURL)
                  ? "selected"
                  : ""
              }`}
              onClick={() => setAvatarId(INITIAL_AVATAR_ID)}
              title="Usar a inicial do meu nome"
            >
              {(name || currentUser.email || "?").charAt(0).toUpperCase()}
            </button>
          </div>

          {avatarPhoto && (
            <div className="avatar-photo-actions">
              <label className="avatar-photo-link">
                {processingPhoto ? "Processando..." : "Trocar minha foto"}
                <input type="file" accept="image/*" onChange={handlePhotoSelect} hidden />
              </label>
              <button type="button" className="avatar-photo-link" onClick={handleRemovePhoto}>
                Remover foto
              </button>
            </div>
          )}

          <h3 className="profile-section-title">Seus dados</h3>

          <div className="profile-form-grid">
            <label>
              Nome
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </label>
            <label>
              Sobrenome
              <input
                className="input"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Seu sobrenome"
              />
            </label>
          </div>

          <label>
            E-mail
            <input className="input" value={currentUser.email || ""} disabled />
          </label>

          <h3 className="profile-section-title">Endereço de entrega</h3>

          <div className="profile-form-grid profile-form-grid-3">
            <label>
              CEP
              <input
                className="input"
                name="zipCode"
                value={address.zipCode}
                onChange={handleCepChange}
                placeholder="00000-000"
                inputMode="numeric"
                maxLength={9}
              />
              <small>{loadingCep ? "Buscando endereço..." : "Preenche o resto sozinho"}</small>
            </label>
            <label className="span-2">
              Rua
              <input
                className="input"
                name="street"
                value={address.street}
                onChange={handleAddressChange}
                placeholder="Nome da rua"
              />
            </label>
          </div>

          <div className="profile-form-grid profile-form-grid-3">
            <label>
              Número
              <input
                className="input"
                name="number"
                value={address.number}
                onChange={handleAddressChange}
                placeholder="123"
              />
            </label>
            <label className="span-2">
              Complemento
              <input
                className="input"
                name="complement"
                value={address.complement}
                onChange={handleAddressChange}
                placeholder="Apto, bloco, referência (opcional)"
              />
            </label>
          </div>

          <div className="profile-form-grid profile-form-grid-3">
            <label className="span-2">
              Bairro
              <input
                className="input"
                name="neighborhood"
                value={address.neighborhood}
                onChange={handleAddressChange}
                placeholder="Bairro"
              />
            </label>
            <label>
              Estado
              <input
                className="input"
                name="state"
                value={address.state}
                onChange={handleAddressChange}
                placeholder="UF"
                maxLength={2}
              />
            </label>
          </div>

          <label>
            Cidade
            <input
              className="input"
              name="city"
              value={address.city}
              onChange={handleAddressChange}
              placeholder="Sua cidade"
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>

          <h3 className="profile-section-title">Conta e segurança</h3>

          <div className="profile-account-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handlePasswordReset}
              disabled={sendingReset}
            >
              {sendingReset ? "Enviando..." : "🔑 Trocar minha senha"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Sair da conta
            </button>
          </div>
          <small className="profile-account-hint">
            Por segurança, a troca de senha é feita por um link enviado para o seu e-mail.
          </small>
        </form>
      </div>
    </div>
  );
}
