import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useSeo } from "../hooks/useSeo";
import { useShippingSettings } from "../hooks/useShippingSettings";
import { isOutOfStock, isLowStock, hasStockControl } from "../utils/stock";
import { getDiscount } from "../utils/pricing";
import { trackProductView, trackAddToCart } from "../api/stats";
import ProductCard from "../components/ProductCard";
import "../components/ProductSkeleton.css";
import "./ProductDetail.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductDetail() {
  const { id } = useParams();
  const { products, loading } = useProducts();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { showToast } = useToast();
  const { shipping } = useShippingSettings();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const product = products.find((p) => p.id === id);

  useSeo({
    title: product?.name,
    description: product?.description || `Confira ${product?.name || "este produto"} na loja SilBeauty.`,
  });

  // Ao abrir outro produto (pelos "relacionados", por exemplo), o React
  // reaproveita este mesmo componente — então reiniciamos o que é específico
  // do produto anterior, em vez de carregar a quantidade escolhida antes.
  const [lastId, setLastId] = useState(id);
  if (lastId !== id) {
    setLastId(id);
    setQuantity(1);
    setZoomOpen(false);
  }

  // Conta a visita (uma vez por produto, por aba) para o painel mostrar
  // quais produtos atraem interesse e quais convertem em venda.
  useEffect(() => {
    if (id) trackProductView(id);
  }, [id]);

  // Fecha o zoom com a tecla Esc.
  useEffect(() => {
    if (!zoomOpen) return undefined;
    function handleKey(e) {
      if (e.key === "Escape") setZoomOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [zoomOpen]);

  // Skeleton no lugar de "Carregando...": o cliente já vê a estrutura da
  // página se formando, o que dá sensação de rapidez e evita o salto de
  // layout quando o conteúdo chega.
  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail">
          <div className="detail-image shimmer" />
          <div className="detail-info">
            <div className="skeleton-line shimmer" style={{ width: "30%" }} />
            <div className="skeleton-line shimmer" style={{ width: "75%", height: "28px" }} />
            <div className="skeleton-line shimmer" style={{ width: "40%", height: "22px" }} />
            <div className="skeleton-line shimmer" style={{ width: "100%" }} />
            <div className="skeleton-line shimmer" style={{ width: "90%" }} />
            <div className="skeleton-btn shimmer" style={{ maxWidth: "260px" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="detail-status">
        <p>Produto não encontrado.</p>
        <Link to="/" className="btn btn-primary">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const outOfStock = isOutOfStock(product);
  const lowStock = isLowStock(product);
  const discount = getDiscount(product);
  const favorite = isFavorite(product.id);
  const maxQuantity = hasStockControl(product) ? Math.max(product.stock, 1) : Infinity;
  // Só anuncia o frete grátis se realmente existir cobrança de frete.
  const freeShippingFrom =
    Number(shipping.fee) > 0 ? Number(shipping.freeAbove) || 0 : 0;

  // Sugestões: mesma categoria primeiro; se não houver, os mais recentes.
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.category && p.category === product.category
  );
  const others = products.filter((p) => p.id !== product.id && !sameCategory.includes(p));
  const related = [...sameCategory, ...others].slice(0, 4);

  function handleAdd() {
    if (outOfStock) return;
    addToCart(product, quantity);
    trackAddToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleToggleFavorite() {
    toggleFavorite(product);
    showToast(favorite ? "Removido dos favoritos" : "Adicionado aos favoritos", {
      type: favorite ? "info" : "success",
    });
  }

  async function handleShare() {
    const url = window.location.href;
    const shareData = {
      title: product.name,
      text: `Olha esse produto na SilBeauty: ${product.name} — ${formatPrice(product.price)}`,
      url,
    };

    // No celular, abre a folha de compartilhamento nativa (WhatsApp, Instagram,
    // etc). No desktop, onde isso quase nunca existe, copia o link.
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        return; // cliente cancelou o compartilhamento
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copiado! Cole onde quiser compartilhar.", { type: "success" });
    } catch {
      showToast("Não foi possível copiar o link.", { type: "error" });
    }
  }

  return (
    <div className="product-detail-page">
      <nav className="detail-breadcrumb" aria-label="Você está em">
        <Link to="/">Loja</Link>
        {product.category && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/?categoria=${encodeURIComponent(product.category)}`}>
              {product.category}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="detail-breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className="detail-image">
          {product.image ? (
            <button
              type="button"
              className="detail-image-btn"
              onClick={() => setZoomOpen(true)}
              aria-label="Ampliar imagem"
            >
              <img
                src={product.image}
                alt={product.name}
                className={outOfStock ? "is-out-of-stock" : ""}
              />
              <span className="detail-zoom-hint">🔍 Ampliar</span>
            </button>
          ) : (
            <div className="detail-placeholder">Sem imagem</div>
          )}

          {discount && !outOfStock && (
            <span className="detail-discount-badge">-{discount.percent}%</span>
          )}
        </div>

        <div className="detail-info">
          {product.category && <span className="detail-category">{product.category}</span>}
          <h1>{product.name}</h1>

          <div className="detail-price-row">
            {discount && <s className="detail-old-price">{formatPrice(discount.oldPrice)}</s>}
            <p className="detail-price">{formatPrice(product.price)}</p>
            {discount && (
              <span className="detail-saved">
                Você economiza {formatPrice(discount.saved)}
              </span>
            )}
          </div>

          {outOfStock && <p className="detail-stock-notice out">Produto indisponível no momento</p>}
          {!outOfStock && lowStock && (
            <p className="detail-stock-notice low">Últimas {product.stock} unidades em estoque!</p>
          )}

          {freeShippingFrom > 0 && (
            <p className="detail-free-shipping">
              🚚 Frete grátis em compras acima de {formatPrice(freeShippingFrom)}
            </p>
          )}

          {product.description && <p className="detail-description">{product.description}</p>}

          <div className="detail-actions">
            <div className="quantity-picker">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={outOfStock}>
                -
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={outOfStock}
              >
                +
              </button>
            </div>
            <button className="btn btn-primary" onClick={handleAdd} disabled={outOfStock}>
              {outOfStock ? "Indisponível" : added ? "Adicionado! ✓" : "Adicionar ao carrinho"}
            </button>
          </div>

          <div className="detail-secondary-actions">
            <button
              className={`detail-icon-btn ${favorite ? "active" : ""}`}
              onClick={handleToggleFavorite}
              aria-pressed={favorite}
            >
              {favorite ? "♥ Nos favoritos" : "♡ Favoritar"}
            </button>
            <button className="detail-icon-btn" onClick={handleShare}>
              ↗ Compartilhar
            </button>
          </div>

          <Link to="/" className="detail-back">
            ← Voltar para a loja
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="detail-related">
          <h2>{sameCategory.length > 0 ? "Você também vai gostar" : "Veja outros produtos"}</h2>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* No <body> (portal): a animação de entrada da página aplica um
          transform no container, o que recortaria este overlay fixo. */}
      {zoomOpen &&
        product.image &&
        createPortal(
          <div
            className="detail-zoom-overlay"
            onClick={() => setZoomOpen(false)}
            role="dialog"
            aria-label={`Imagem ampliada de ${product.name}`}
          >
            <button className="detail-zoom-close" aria-label="Fechar imagem">
              ✕
            </button>
            <img src={product.image} alt={product.name} onClick={(e) => e.stopPropagation()} />
          </div>,
          document.body
        )}
    </div>
  );
}
