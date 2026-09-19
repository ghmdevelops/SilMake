import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useProducts } from "../hooks/useProducts";
import { isOutOfStock } from "../utils/stock";
import Drawer from "./Drawer";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FavoritesDrawer({ open, onClose }) {
  const { items, removeFavorite, totalItems } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { products } = useProducts();

  // Os favoritos ficam no localStorage, então o preço e o estoque podem estar
  // desatualizados. Sempre que o produto ainda existe, mostramos o dado atual.
  function currentProduct(item) {
    return products.find((p) => p.id === item.id) || item;
  }

  function handleAdd(item) {
    const product = currentProduct(item);
    if (isOutOfStock(product)) {
      showToast("Este produto está esgotado.", { type: "info" });
      return;
    }
    addToCart(product, 1);
    showToast(`${product.name} adicionado ao carrinho`, { type: "success" });
  }

  const footer =
    items.length > 0 ? (
      <Link to="/favoritos" className="btn btn-ghost" onClick={onClose}>
        Ver página de favoritos
      </Link>
    ) : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Meus favoritos${totalItems > 0 ? ` (${totalItems})` : ""}`}
      footer={footer}
    >
      {items.length === 0 ? (
        <div className="drawer-empty">
          <span className="drawer-empty-icon">⭐</span>
          <p>Você ainda não favoritou nada.</p>
          <p className="drawer-empty-hint">
            Toque no coração de um produto para guardá-lo aqui.
          </p>
          <Link to="/" className="btn btn-primary" onClick={onClose}>
            Ver produtos
          </Link>
        </div>
      ) : (
        items.map((item) => {
          const product = currentProduct(item);
          const unavailable = isOutOfStock(product);

          return (
            <div className="drawer-item" key={item.id}>
              <Link to={`/produto/${item.id}`} className="drawer-item-image" onClick={onClose}>
                {product.image && <img src={product.image} alt={product.name} />}
              </Link>

              <div className="drawer-item-info">
                <Link to={`/produto/${item.id}`} className="drawer-item-name" onClick={onClose}>
                  {product.name}
                </Link>
                <p className="drawer-item-price">{formatPrice(product.price)}</p>
              </div>

              <div className="drawer-item-actions">
                <button
                  className="drawer-item-remove"
                  onClick={() => removeFavorite(item.id)}
                  aria-label={`Remover ${product.name} dos favoritos`}
                >
                  ✕
                </button>
                <button
                  className="drawer-add-btn"
                  onClick={() => handleAdd(item)}
                  disabled={unavailable}
                >
                  {unavailable ? "Esgotado" : "+ Carrinho"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </Drawer>
  );
}
