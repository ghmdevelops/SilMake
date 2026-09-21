import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useSeo } from "../hooks/useSeo";
import ProductCard from "../components/ProductCard";
import "./Home.css";
import "./Favorites.css";

export default function Favorites() {
  useSeo({
    title: "Favoritos",
    description: "Veja os produtos que você salvou como favoritos na SilBeauty.",
  });

  const { items } = useWishlist();

  return (
    <div className="home favorites-page">
      <section className="favorites-hero">
        <h1>Seus favoritos</h1>
        <p>Os produtos que você salvou para ver depois.</p>
      </section>

      {items.length === 0 ? (
        <div className="home-empty">
          <span className="home-empty-icon">♡</span>
          <p>Você ainda não adicionou nenhum favorito.</p>
          <Link to="/" className="btn btn-primary">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
