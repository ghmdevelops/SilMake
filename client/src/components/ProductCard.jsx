import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import "./ProductCard.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useWishlist();
  const favorite = isFavorite(product.id);

  function handleAdd() {
    addToCart(product, 1);
    showToast(`${product.name} adicionado ao carrinho`, { type: "success" });
  }

  function handleToggleFavorite() {
    toggleFavorite(product);
    showToast(
      favorite ? `${product.name} removido dos favoritos` : `${product.name} adicionado aos favoritos`,
      { type: favorite ? "info" : "success" }
    );
  }

  return (
    <div className="product-card">
      <div className="product-card-image-wrap">
        <Link to={`/produto/${product.id}`} className="product-card-image-link">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" />
          ) : (
            <div className="product-card-placeholder">Sem imagem</div>
          )}
          <span className="product-card-overlay">Ver detalhes</span>
        </Link>

        <button
          className={`favorite-btn ${favorite ? "active" : ""}`}
          onClick={handleToggleFavorite}
          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={favorite}
        >
          {favorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="product-card-body">
        {product.category && <span className="product-card-category">{product.category}</span>}
        <Link to={`/produto/${product.id}`} className="product-card-name">
          {product.name}
        </Link>
        <p className="product-card-price">{formatPrice(product.price)}</p>

        <button className="btn btn-primary product-card-btn" onClick={handleAdd}>
          <span>+</span> Adicionar
        </button>
      </div>
    </div>
  );
}
