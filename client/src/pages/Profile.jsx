import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { saveUserProfile } from "../api/userProfile";
import { useToast } from "../context/ToastContext";
import { useSeo } from "../hooks/useSeo";
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

export default function Profile() {
  useSeo({ title: "Meu Perfil", description: "Gerencie seus dados na SilBeauty." });

  const { currentUser, loading: authLoading, updateUserProfile } = useAuth();
  const { profile } = useUserProfile(currentUser?.uid);
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName?.split(" ")[0] || "");
    }
    if (profile) {
      setSurname(profile.surname || "");
      setAddress({ ...emptyAddress, ...(profile.address || {}) });
    }
  }, [currentUser, profile]);

  if (!authLoading && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  function handleAddressChange(e) {
    const { name: field, value } = e.target;
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fullName = surname ? `${name} ${surname}` : name;
      await updateUserProfile({ displayName: fullName });
      await saveUserProfile(currentUser.uid, { name, surname, address });
      showToast("Perfil atualizado com sucesso!", { type: "success" });
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar perfil", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return null;

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1>Meu perfil</h1>
        <Link to="/meus-pedidos" className="btn btn-ghost">
          📦 Meus pedidos
        </Link>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt={currentUser.displayName || "Usuário"} />
          ) : (
            <span>{(name || currentUser.email || "?").charAt(0).toUpperCase()}</span>
          )}
        </div>

        <form className="profile-form" onSubmit={handleSave}>
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
                onChange={handleAddressChange}
                placeholder="00000-000"
              />
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
        </form>
      </div>
    </div>
  );
}
