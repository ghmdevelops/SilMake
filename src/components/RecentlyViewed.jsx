import { useProducts } from "../hooks/useProducts";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import ProductCard from "./ProductCard";
import { Clock } from "./icons";
import "./NewArrivals.css";
import "./RecentlyViewed.css";

// Mostra os produtos que este visitante abriu antes. Resolve o caso comum de
// olhar vários itens, sair e não achar de volta aquele que quase comprou.
//
// `currentId` remove o produto que está sendo visto no momento — na página
// do produto, listá-lo ali seria um link para onde a pessoa já está.
export default function RecentlyViewed({ currentId, title = "Vistos recentemente" }) {
  const { products } = useProducts();
  const { ids } = useRecentlyViewed(currentId);

  // A ordem vem dos IDs (mais recente primeiro), não do catálogo. Produtos
  // excluídos ou pausados simplesmente somem da lista.
  const items = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  // Com um único item a seção não ajuda: ou é o produto que a pessoa acabou
  // de ver, ou é a primeira visita.
  if (items.length < 2) return null;

  return (
    <section className="new-arrivals recently-viewed">
      <div className="new-arrivals-heading">
        <span className="new-arrivals-badge">
          <Clock size={18} /> {title}
        </span>
        <p>Você deu uma olhada nestes</p>
      </div>

      <div className="new-arrivals-track">
        {items.map((product) => (
          <div className="new-arrivals-item" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
