import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useShippingSettings } from "../hooks/useShippingSettings";
import { resolveShipping, missingForFreeShipping } from "../api/settings";
import Drawer from "./Drawer";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CartDrawer({ open, onClose }) {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const { shipping } = useShippingSettings();

  // O mini-carrinho não tem campo de CEP, então frete que dependa do destino
  // fica como "a calcular" — o cliente resolve no carrinho completo.
  const {
    fee: shippingFee,
    pending: shippingPending,
    toBeArranged,
  } = resolveShipping({ subtotal: totalPrice, shipping });
  const missingForFree = missingForFreeShipping(totalPrice, shipping);

  const footer =
    items.length > 0 ? (
      <>
        <div className="drawer-total-line">
          <span>Subtotal</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className="drawer-total-line">
          <span>Frete</span>
          {shippingPending ? (
            <span className="drawer-pending">a calcular pelo CEP</span>
          ) : toBeArranged ? (
            <span className="drawer-pending">a combinar</span>
          ) : shippingFee > 0 ? (
            <span>{formatPrice(shippingFee)}</span>
          ) : (
            <span className="drawer-free">Grátis</span>
          )}
        </div>

        {missingForFree > 0 && (
          <div className="drawer-free-hint">
            Faltam <strong>{formatPrice(missingForFree)}</strong> para frete grátis
          </div>
        )}

        <div className="drawer-total">
          <span>Total{shippingPending || toBeArranged ? " + frete" : ""}</span>
          <strong>{formatPrice(totalPrice + shippingFee)}</strong>
        </div>

        <Link to="/carrinho" className="btn btn-primary" onClick={onClose}>
          {shippingPending ? "Calcular frete e finalizar" : "Finalizar compra"}
        </Link>
        <button className="drawer-secondary-link" onClick={onClose}>
          Continuar comprando
        </button>
      </>
    ) : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Meu carrinho${totalItems > 0 ? ` (${totalItems})` : ""}`}
      footer={footer}
    >
      {items.length === 0 ? (
        <div className="drawer-empty">
          <span className="drawer-empty-icon">🛒</span>
          <p>Seu carrinho está vazio.</p>
          <Link to="/" className="btn btn-primary" onClick={onClose}>
            Ver produtos
          </Link>
        </div>
      ) : (
        items.map((item) => (
          <div className="drawer-item" key={item.id}>
            <Link to={`/produto/${item.id}`} className="drawer-item-image" onClick={onClose}>
              {item.image && <img src={item.image} alt={item.name} />}
            </Link>

            <div className="drawer-item-info">
              <Link to={`/produto/${item.id}`} className="drawer-item-name" onClick={onClose}>
                {item.name}
              </Link>
              <p className="drawer-item-price">{formatPrice(item.price * item.quantity)}</p>
            </div>

            <div className="drawer-item-actions">
              <button
                className="drawer-item-remove"
                onClick={() => removeFromCart(item.id)}
                aria-label={`Remover ${item.name}`}
              >
                ✕
              </button>
              <div className="drawer-qty">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  aria-label="Diminuir quantidade"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </Drawer>
  );
}
