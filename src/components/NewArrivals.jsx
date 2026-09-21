import ProductCard from "./ProductCard";
import { Sparkles } from "./icons";
import "./NewArrivals.css";

const MAX_ITEMS = 8;

export default function NewArrivals({ products }) {
  const recent = [...products]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, MAX_ITEMS);

  if (recent.length === 0) return null;

  return (
    <section className="new-arrivals">
      <div className="new-arrivals-heading">
        <span className="new-arrivals-badge">
          <Sparkles size={18} /> Novidades
        </span>
        <p>Os últimos produtos que chegaram na loja</p>
      </div>

      <div className="new-arrivals-track">
        {recent.map((product) => (
          <div className="new-arrivals-item" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
