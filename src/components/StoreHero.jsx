import { Sparkles } from "./icons";
import "./StoreHero.css";

// Bloco de identidade no topo da home. Aparece SEMPRE.
//
// Antes ele só entrava quando o catálogo estava vazio, o que na prática
// significava nunca. O efeito era uma loja que abria direto nos produtos, sem
// dizer o que é — grandes marcas podem fazer isso porque já são conhecidas;
// uma loja nova, que recebe visita do Instagram, não.
//
// É deliberadamente compacto: diz quem somos sem empurrar o produto para
// fora da primeira tela. O carrossel logo abaixo continua sendo o destaque
// visual.
export default function StoreHero() {
  return (
    <section className="store-hero">
      <span className="store-hero-badge">
        <Sparkles size={14} />
        Loja oficial
      </span>

      {/* Único h1 da página: descreve a loja para quem lê e para os
          buscadores. */}
      <h1>
        Beleza que <span>combina com você</span>
      </h1>

      <p>
        Maquiagem, skincare e perfumaria escolhidos com carinho. Enviamos para todo o
        Brasil, com frete grátis e acompanhamento do pedido pelo site.
      </p>
    </section>
  );
}
