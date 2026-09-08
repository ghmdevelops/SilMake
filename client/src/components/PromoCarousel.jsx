import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import "./PromoCarousel.css";

const AUTOPLAY_MS = 4500;

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PromoCarousel({ products, demo = false }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (products.length <= 1) return undefined;

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(timerRef.current);
  }, [products.length]);

  if (!products || products.length === 0) return null;

  function goTo(i) {
    clearInterval(timerRef.current);
    setIndex((i + products.length) % products.length);
  }

  function handleAdd(product) {
    if (demo) {
      showToast("Este é só um produto de exemplo, cadastre produtos reais no admin.", {
        type: "info",
      });
      return;
    }
    addToCart(product, 1);
    showToast(`${product.name} adicionado ao carrinho`, { type: "success" });
  }

  return (
    <section className="promo-carousel">
      <div className="promo-carousel-viewport">
        <div className="promo-carousel-heading">
          <span className="promo-badge">🔥 Promoção da semana</span>
          {demo && (
            <span className="promo-demo-note">
              Pré-visualização com imagens de exemplo — marque um produto real como promoção no
              admin para substituir.
            </span>
          )}
        </div>

        <div className="promo-carousel-body">
        <button
          className="promo-nav promo-nav-prev"
          onClick={() => goTo(index - 1)}
          aria-label="Produto anterior"
        >
          ‹
        </button>

        <div
          className="promo-carousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {products.map((product) => {
            const ImageTag = demo ? "div" : Link;
            const NameTag = demo ? "span" : Link;
            const imageProps = demo ? {} : { to: `/produto/${product.id}` };
            const nameProps = demo ? {} : { to: `/produto/${product.id}` };

            return (
              <div className="promo-slide" key={product.id}>
                <ImageTag {...imageProps} className="promo-slide-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="promo-slide-placeholder">Sem imagem</div>
                  )}
                </ImageTag>

                <div className="promo-slide-info">
                  {product.category && <span className="promo-slide-category">{product.category}</span>}
                  <NameTag {...nameProps} className="promo-slide-name">
                    {product.name}
                  </NameTag>
                  {product.description && (
                    <p className="promo-slide-description">{product.description}</p>
                  )}
                  <p className="promo-slide-price">{formatPrice(product.price)}</p>
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
          onClick={() => goTo(index + 1)}
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
              className={`promo-dot ${i === index ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Ir para o produto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
