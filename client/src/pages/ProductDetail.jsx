import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useCart } from "../context/CartContext";
import { useSeo } from "../hooks/useSeo";
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
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = products.find((p) => p.id === id);

  useSeo({
    title: product?.name,
    description: product?.description || `Confira ${product?.name || "este produto"} na loja SilBeauty.`,
  });

  if (loading) return <p className="detail-status">Carregando...</p>;

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

  function handleAdd() {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="product-detail">
      <div className="detail-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="detail-placeholder">Sem imagem</div>
        )}
      </div>

      <div className="detail-info">
        {product.category && <span className="detail-category">{product.category}</span>}
        <h1>{product.name}</h1>
        <p className="detail-price">{formatPrice(product.price)}</p>
        {product.description && <p className="detail-description">{product.description}</p>}

        <div className="detail-actions">
          <div className="quantity-picker">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            {added ? "Adicionado! ✓" : "Adicionar ao carrinho"}
          </button>
        </div>

        <Link to="/" className="detail-back">
          ← Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
