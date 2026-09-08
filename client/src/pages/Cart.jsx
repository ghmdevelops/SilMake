import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { useSeo } from "../hooks/useSeo";
import { buildWhatsappLink } from "../config";
import { createOrder } from "../api/orders";
import "./Cart.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAddress(address) {
  if (!address) return "";
  const { street, number, complement, neighborhood, city, state, zipCode } = address;
  if (!street) return "";
  const line1 = [street, number].filter(Boolean).join(", ");
  const line2 = [neighborhood, city, state].filter(Boolean).join(" - ");
  return [line1, complement, line2, zipCode].filter(Boolean).join("\n");
}

export default function Cart() {
  useSeo({ title: "Carrinho", description: "Revise os produtos do seu carrinho na SilBeauty." });

  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { profile } = useUserProfile(currentUser?.uid);
  const navigate = useNavigate();

  async function handleCheckout() {
    // Boa prática: exige login antes de finalizar, para vincular o pedido à
    // conta do cliente e permitir o histórico de compras no perfil.
    if (!currentUser) {
      showToast("Entre na sua conta para finalizar a compra", { type: "info" });
      navigate("/login", { state: { from: "/carrinho" } });
      return;
    }

    const address = formatAddress(profile?.address);
    if (!address) {
      showToast("Adicione um endereço de entrega no seu perfil antes de finalizar", {
        type: "info",
        duration: 4500,
      });
      navigate("/perfil");
      return;
    }

    const now = Date.now();
    const lines = items.map(
      (item) =>
        `• ${item.name} (x${item.quantity}) — ${formatPrice(item.price * item.quantity)}`
    );

    let orderNumber = "";
    try {
      orderNumber = await createOrder(currentUser.uid, {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: totalPrice,
        address: profile.address,
        customerName: currentUser.displayName || "",
        customerEmail: currentUser.email || "",
        createdAt: now,
      });
    } catch (err) {
      console.error("Erro ao salvar histórico do pedido:", err);
    }

    const message = [
      `Olá! Gostaria de finalizar o pedido${orderNumber ? ` #${orderNumber}` : ""} na SilBeauty:`,
      "",
      ...lines,
      "",
      `Total: ${formatPrice(totalPrice)}`,
      "",
      "Endereço de entrega:",
      address,
      "",
      `Nome: ${currentUser.displayName || currentUser.email}`,
      `Data do pedido: ${formatDateTime(now)}`,
    ].join("\n");

    window.open(buildWhatsappLink(message), "_blank", "noopener,noreferrer");

    showToast(
      orderNumber
        ? `Pedido #${orderNumber} enviado! Você será redirecionado para o WhatsApp.`
        : "Você será redirecionado para o WhatsApp para concluir o pedido",
      { type: "info", duration: 4500 }
    );

    clearCart();
  }

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <span className="cart-empty-icon">🛒</span>
        <p>Seu carrinho está vazio.</p>
        <Link to="/" className="btn btn-primary">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Seu carrinho</h1>

      <div className="cart-list">
        {items.map((item) => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item-image">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="cart-item-placeholder" />
              )}
            </div>

            <div className="cart-item-info">
              <Link to={`/produto/${item.id}`} className="cart-item-name">
                {item.name}
              </Link>
              <p className="cart-item-price">{formatPrice(item.price)}</p>
            </div>

            <div className="quantity-picker">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            </div>

            <p className="cart-item-subtotal">
              {formatPrice(item.price * item.quantity)}
            </p>

            <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <button className="btn btn-ghost" onClick={clearCart}>
          Esvaziar carrinho
        </button>
        <div className="cart-total">
          <span>Total</span>
          <strong>{formatPrice(totalPrice)}</strong>
        </div>
        <button className="btn btn-primary" onClick={handleCheckout}>
          Finalizar compra
        </button>
      </div>
    </div>
  );
}
