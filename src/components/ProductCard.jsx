import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { isOutOfStock, isLowStock } from "../utils/stock";
import { getDiscount } from "../utils/pricing";
import { trackAddToCart } from "../api/stats";
import { Heart } from "./icons";
import ShareProduct from "./ShareProduct";
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
  const outOfStock = isOutOfStock(product);
  const lowStock = isLowStock(product);
  const discount = getDiscount(product);

  function handleAdd() {
    if (outOfStock) return;
    addToCart(product, 1);
    trackAddToCart(product.id);
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
    <div className={`product-card ${outOfStock ? "out-of-stock" : ""}`}>
      <div className="product-card-image-wrap">
        <Link to={`/produto/${product.id}`} className="product-card-image-link">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" />
          ) : (
            <div className="product-card-placeholder">Sem imagem</div>
          )}
          <span className="product-card-overlay">Ver detalhes</span>
        </Link>

        {outOfStock && <span className="product-card-badge out">Esgotado</span>}
        {!outOfStock && lowStock && (
          <span className="product-card-badge low">Últimas {product.stock}!</span>
        )}
        {!outOfStock && discount && (
          <span className="product-card-discount">-{discount.percent}%</span>
        )}

        <div className="product-card-tools">
          <button
            className={`favorite-btn ${favorite ? "active" : ""}`}
            onClick={handleToggleFavorite}
            aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={favorite}
          >
            <Heart size={17} filled={favorite} />
          </button>

          <ShareProduct product={product} compact />
        </div>
      </div>

      <div className="product-card-body">
        {product.category && <span className="product-card-category">{product.category}</span>}
        {/* O title devolve o nome inteiro ao passar o mouse, já que o card
            corta em duas linhas para manter a fileira alinhada. */}
        <Link to={`/produto/${product.id}`} className="product-card-name" title={product.name}>
          {product.name}
        </Link>
        <p className="product-card-price">
          {discount && (
            <s className="product-card-old-price">{formatPrice(discount.oldPrice)}</s>
          )}
          {formatPrice(product.price)}
        </p>

        <button
          className="btn btn-primary product-card-btn"
          onClick={handleAdd}
          disabled={outOfStock}
        >
          {outOfStock ? "Indisponível" : (
            <>
              <span>+</span> Adicionar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
