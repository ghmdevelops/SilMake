import "./StoreHero.css";

// Banner de marca no topo da home. Ele aparece quando NÃO há promoção ativa:
// o espaço nobre da página nunca fica vazio, e o visitante que chega pela
// primeira vez entende de cara o que a loja é. Quando você marca um produto
// como "Promoção da semana" no admin, o carrossel assume esse lugar.
export default function StoreHero() {
  return (
    <section className="store-hero">
      <div className="store-hero-content">
        <span className="store-hero-badge">✨ Bem-vinda à SilBeauty</span>
        <h1>
          Beleza que <span>combina com você</span>
        </h1>
        <p>Produtos escolhidos com carinho para o seu dia a dia.</p>
        <a href="#produtos" className="btn btn-primary">
          Ver produtos
        </a>
      </div>

      <div className="store-hero-decoration" aria-hidden="true">
        <span>💄</span>
        <span>🌸</span>
        <span>✨</span>
      </div>
    </section>
  );
}
