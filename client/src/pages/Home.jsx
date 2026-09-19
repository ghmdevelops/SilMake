import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useSeo } from "../hooks/useSeo";
import ProductCard from "../components/ProductCard";
import ProductSkeleton from "../components/ProductSkeleton";
import PromoCarousel from "../components/PromoCarousel";
import StoreHero from "../components/StoreHero";
import NewArrivals from "../components/NewArrivals";
import { matchesSearch } from "../utils/normalizeText";
import { getDiscount } from "../utils/pricing";
import { trackEmptySearch } from "../api/stats";
import "./Home.css";

export default function Home() {
  useSeo({
    description:
      "Conheça a SilBeauty: produtos artesanais feitos com carinho. Velas, cerâmica, acessórios e muito mais.",
  });

  const { products, loading } = useProducts();
  // Permite links diretos para uma categoria (ex: o breadcrumb da página do
  // produto aponta para /?categoria=Maquiagem).
  const [searchParams, setSearchParams] = useSearchParams();
  // A busca também vem da URL (?busca=...), usada pelo ícone de busca do menu
  // e por links compartilhados.
  const [search, setSearch] = useState(searchParams.get("busca") || "");
  const [category, setCategory] = useState(searchParams.get("categoria") || "Todos");
  const [sortBy, setSortBy] = useState("recent");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Entram no carrossel de promoção tanto os produtos marcados como
  // "Promoção da semana" no admin quanto os que têm preço antigo cadastrado
  // (ou seja, desconto real). Assim, basta colocar um preço promocional para
  // o produto já aparecer em destaque, sem um segundo passo.
  const promoProducts = useMemo(
    () => products.filter((p) => p.promotion || getDiscount(p)),
    [products]
  );

  // Sem nenhuma promoção, o carrossel continua no ar girando os produtos mais
  // recentes — só com o título honesto de "Destaques", não de promoção.
  const highlightProducts = useMemo(
    () => [...products].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5),
    [products]
  );

  const carouselProducts = promoProducts.length > 0 ? promoProducts : highlightProducts;
  const isPromo = promoProducts.length > 0;

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Todos", ...set];
  }, [products]);

  const hasActiveFilters =
    search !== "" || category !== "Todos" || minPrice !== "" || maxPrice !== "";
  // Sinaliza no botão quando há filtro escondido ativo, para o cliente não
  // achar que a vitrine está com menos produtos do que tem.
  const hasSecondaryFilters = minPrice !== "" || maxPrice !== "" || sortBy !== "recent";

  // Uma nova busca vinda do menu (mesma rota, parâmetro diferente) precisa
  // atualizar o campo — o React reaproveita a página e não remonta.
  const urlSearch = searchParams.get("busca") || "";
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);
  if (lastUrlSearch !== urlSearch) {
    setLastUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  // Registra buscas que não acharam nada: é o que seus clientes procuram e
  // você ainda não vende. Espera 1,2s para não contar a palavra sendo digitada.
  useEffect(() => {
    if (loading || search.trim().length < 3) return;

    const timer = setTimeout(() => {
      const found = products.some((p) => matchesSearch(search, [p.name, p.category, p.description]));
      if (!found) trackEmptySearch(search);
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, loading]);

  // Mantém a URL em sincronia com a categoria escolhida, para que o filtro
  // sobreviva a um compartilhamento de link ou a um recarregamento.
  function handleCategoryChange(cat) {
    setCategory(cat);
    if (cat === "Todos") {
      searchParams.delete("categoria");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ categoria: cat }, { replace: true });
    }
  }

  function clearFilters() {
    setSearch("");
    handleCategoryChange("Todos");
    setMinPrice("");
    setMaxPrice("");
  }

  const filtered = products
    .filter((p) => {
      // A busca considera nome, categoria e descrição, e ignora acentos.
      const matchesTerm = matchesSearch(search, [p.name, p.category, p.description]);
      const matchesCategory = category === "Todos" || p.category === category;
      const price = Number(p.price || 0);
      const matchesMin = minPrice === "" || price >= Number(minPrice);
      const matchesMax = maxPrice === "" || price <= Number(maxPrice);
      return matchesTerm && matchesCategory && matchesMin && matchesMax;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  return (
    <div className="home">
      {/* Título para buscadores e leitores de tela — o texto visível da
          identidade fica no banner/carrossel. */}
      <h1 className="sr-only">SilBeauty — maquiagem, cuidados e perfumaria</h1>

      {/* O carrossel (que passa sozinho) fica sempre no topo enquanto houver
          produtos. O banner da loja só entra quando o catálogo está vazio. */}
      {!loading &&
        (carouselProducts.length > 0 ? (
          <PromoCarousel
            products={carouselProducts}
            title={isPromo ? "🔥 Promoção da semana" : "✨ Destaques da loja"}
          />
        ) : (
          <StoreHero />
        ))}

      {/* Sem promoção o carrossel já está girando os mais recentes — repetir
          a seção de novidades logo abaixo mostraria os mesmos produtos duas
          vezes seguidas. */}
      {!loading && isPromo && <NewArrivals products={products} />}

      <div className="home-filters" id="produtos">
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
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* No celular os filtros de preço e ordenação empurravam os produtos
            para fora da tela. Agora ficam atrás deste botão, que só aparece
            em telas pequenas. */}
        <button
          type="button"
          className="filters-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          ⚙ {filtersOpen ? "Ocultar filtros" : "Filtros e ordenação"}
          {hasSecondaryFilters && !filtersOpen && <span className="filters-dot" />}
        </button>

        <div className={`secondary-filters ${filtersOpen ? "is-open" : ""}`}>
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

          {hasActiveFilters && (
            <button className="btn btn-ghost clear-filters-btn" onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
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
          <p>
            {products.length === 0
              ? "Nenhum produto cadastrado ainda. Volte em breve!"
              : "Nenhum produto encontrado com esses filtros."}
          </p>
          {hasActiveFilters && (
            <button className="btn btn-primary" onClick={clearFilters}>
              Limpar filtros e ver tudo
            </button>
          )}
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
