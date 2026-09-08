import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { useOrders } from "../hooks/useOrders";
import { saveUserProfile } from "../api/userProfile";
import { useToast } from "../context/ToastContext";
import { useSeo } from "../hooks/useSeo";
import "./Profile.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  useSeo({ title: "Meu Perfil", description: "Gerencie seus dados e veja seus pedidos na SilMake." });

  const { currentUser, loading: authLoading, updateUserProfile } = useAuth();
  const { profile } = useUserProfile(currentUser?.uid);
  const { orders, loading: ordersLoading } = useOrders(currentUser?.uid);
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
      <h1>Meu perfil</h1>

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

      <h2>Meus pedidos</h2>

      {ordersLoading && <p className="profile-status">Carregando pedidos...</p>}

      {!ordersLoading && orders.length === 0 && (
        <div className="profile-empty">
          <p>Você ainda não fez nenhum pedido.</p>
          <Link to="/" className="btn btn-primary">
            Ver produtos
          </Link>
        </div>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-card-header">
              <span className="order-date">{formatDate(order.createdAt)}</span>
              <span className="order-status">Fechado</span>
            </div>
            <ul className="order-items">
              {order.items?.map((item, i) => (
                <li key={i}>
                  {item.name} (x{item.quantity}) — {formatPrice(item.price * item.quantity)}
                </li>
              ))}
            </ul>
            <div className="order-total">
              <span>Total</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
