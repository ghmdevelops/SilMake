import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { getDiscount } from "../utils/pricing";
import { prefersReducedMotion } from "../utils/motion";
import "./PromoCarousel.css";

const AUTOPLAY_MS = 4500;

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PromoCarousel({ products, title = "🔥 Promoção da semana" }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [index, setIndex] = useState(0);
  // Pausa enquanto o cliente está lendo o slide (mouse em cima) ou navegando
  // por teclado dentro dele. Conteúdo que se move sozinho e não pode ser
  // parado é uma barreira de acessibilidade — e irrita qualquer pessoa que
  // tente clicar no produto enquanto ele troca.
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (products.length <= 1 || paused || prefersReducedMotion()) return undefined;

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(timerRef.current);
  }, [products.length, paused]);

  if (!products || products.length === 0) return null;

  // A lista pode encurtar em tempo real (ex: você marca uma promoção e o
  // carrossel troca de conteúdo). Sem isso, o índice antigo apontaria para
  // um slide inexistente e o carrossel apareceria em branco.
  const safeIndex = Math.min(index, products.length - 1);

  function goTo(i) {
    clearInterval(timerRef.current);
    setIndex((i + products.length) % products.length);
  }

  function handleAdd(product) {
    addToCart(product, 1);
    showToast(`${product.name} adicionado ao carrinho`, { type: "success" });
  }

  return (
    <section
      className="promo-carousel"
      aria-roledescription="carrossel"
      aria-label={title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      // Capture porque o foco cai nos filhos (links e botões), não na seção.
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="promo-carousel-viewport">
        <div className="promo-carousel-heading">
          <span className="promo-badge">{title}</span>
        </div>

        <div className="promo-carousel-body">
        <button
          className="promo-nav promo-nav-prev"
          onClick={() => goTo(safeIndex - 1)}
          aria-label="Produto anterior"
        >
          ‹
        </button>

        <div
          className="promo-carousel-track"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {products.map((product) => {
            const discount = getDiscount(product);

            return (
              <div className="promo-slide" key={product.id}>
                <Link to={`/produto/${product.id}`} className="promo-slide-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="promo-slide-placeholder">Sem imagem</div>
                  )}
                  {discount && (
                    <span className="promo-slide-discount">-{discount.percent}%</span>
                  )}
                </Link>

                <div className="promo-slide-info">
                  {product.category && <span className="promo-slide-category">{product.category}</span>}
                  <Link to={`/produto/${product.id}`} className="promo-slide-name">
                    {product.name}
                  </Link>
                  {product.description && (
                    <p className="promo-slide-description">{product.description}</p>
                  )}
                  <p className="promo-slide-price">
                    {discount && (
                      <s className="promo-slide-old-price">{formatPrice(discount.oldPrice)}</s>
                    )}
                    {formatPrice(product.price)}
                  </p>
                  <button className="btn btn-primary" onClick={() => handleAdd(product)}>
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="promo-nav promo-nav-next"
          onClick={() => goTo(safeIndex + 1)}
          aria-label="Próximo produto"
        >
          ›
        </button>
        </div>
      </div>

      {products.length > 1 && (
        <div className="promo-dots">
          {products.map((product, i) => (
            <button
              key={product.id}
              className={`promo-dot ${i === safeIndex ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Ir para o produto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
