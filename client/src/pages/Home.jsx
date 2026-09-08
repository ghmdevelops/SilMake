import { useMemo, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { useSeo } from "../hooks/useSeo";
import ProductCard from "../components/ProductCard";
import ProductSkeleton from "../components/ProductSkeleton";
import PromoCarousel from "../components/PromoCarousel";
import NewArrivals from "../components/NewArrivals";
import "./Home.css";

// Produtos fictícios só para pré-visualizar o carrossel de promoções
// quando ainda não existe nenhum produto real marcado como promoção.
// Assim que você marcar um produto de verdade como "Promoção da semana"
// no admin, esses exemplos somem automaticamente e o carrossel passa a
// mostrar os produtos reais.
const DEMO_PROMO_PRODUCTS = [
  {
    id: "demo-1",
    name: "Batom Matte Rosa Nude (exemplo)",
    price: 39.9,
    category: "Maquiagem",
    description: "Imagem de exemplo — cadastre um produto real e marque como promoção para substituir.",
    image: "https://picsum.photos/seed/silbeauty-demo1/700/700",
  },
  {
    id: "demo-2",
    name: "Paleta de Sombras (exemplo)",
    price: 79.9,
    category: "Maquiagem",
    description: "Imagem de exemplo — cadastre um produto real e marque como promoção para substituir.",
    image: "https://picsum.photos/seed/silbeauty-demo2/700/700",
  },
  {
    id: "demo-3",
    name: "Perfume Floral (exemplo)",
    price: 129.9,
    category: "Perfumaria",
    description: "Imagem de exemplo — cadastre um produto real e marque como promoção para substituir.",
    image: "https://picsum.photos/seed/silbeauty-demo3/700/700",
  },
];

export default function Home() {
  useSeo({
    description:
      "Conheça a SilBeauty: produtos artesanais feitos com carinho. Velas, cerâmica, acessórios e muito mais.",
  });

  const { products, loading } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("recent");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const realPromoProducts = useMemo(() => products.filter((p) => p.promotion), [products]);
  const promoProducts = realPromoProducts.length > 0 ? realPromoProducts : DEMO_PROMO_PRODUCTS;
  const isDemoPromo = realPromoProducts.length === 0;

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

  return (
    <div className="home">
      {!loading && <PromoCarousel products={promoProducts} demo={isDemoPromo} />}

      {!loading && <NewArrivals products={products} />}

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
