import { useEffect, useMemo, useRef, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { useSeo } from "../hooks/useSeo";
import ProductCard from "../components/ProductCard";
import ProductSkeleton from "../components/ProductSkeleton";
import "./Home.css";

function AnimatedText({ text, startDelay = 0, className = "" }) {
  return text.split("").map((char, i) => (
    <span
      key={i}
      className={`letter ${className}`}
      style={{ animationDelay: `${startDelay + i * 0.035}s` }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));
}

export default function Home() {
  useSeo({
    description:
      "Conheça a SilMake: produtos artesanais feitos com carinho. Velas, cerâmica, acessórios e muito mais.",
  });

  const { products, loading } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("recent");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking.current = false;
        });
        ticking.current = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Todos", ...set];
  }, [products]);

  const filtered = products
    .filter((p) => {
      const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "Todos" || p.category === category;
      const price = Number(p.price || 0);
      const matchesMin = minPrice === "" || price >= Number(minPrice);
      const matchesMax = maxPrice === "" || price <= Number(maxPrice);
      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  const firstPart = "Bem-vindo à Sil";

  return (
    <div className="home">
      <section
        className="hero"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`,
          opacity: Math.max(1 - scrollY / 380, 0),
        }}
      >
        <span className="hero-badge">✨ Novidades toda semana</span>
        <h1 className="hero-title">
          <AnimatedText text={firstPart} />
          <AnimatedText text="Make" startDelay={firstPart.length * 0.035} className="gradient-letter" />
        </h1>
        <p className="hero-subtitle">Produtos feitos com carinho, anunciados com estilo.</p>
      </section>

      <div className="home-filters">
        <div className="search-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input search-input"
          />
        </div>

        <div className="category-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="secondary-filters">
          <div className="price-range">
            <input
              type="number"
              min="0"
              className="input price-input"
              placeholder="Preço mín."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="price-range-sep">–</span>
            <input
              type="number"
              min="0"
              className="input price-input"
              placeholder="Preço máx."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <select
            className="input sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Mais recentes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </div>
      </div>

      {!loading && (
        <p className="results-count">
          {filtered.length} produto{filtered.length !== 1 ? "s" : ""} encontrado
          {filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {loading && <ProductSkeleton />}

      {!loading && filtered.length === 0 && (
        <div className="home-empty">
          <span className="home-empty-icon">🔍</span>
          <p>Nenhum produto encontrado.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
