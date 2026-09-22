import { useEffect } from "react";
import { isOutOfStock } from "../utils/stock";
import { getDiscount } from "../utils/pricing";

const TAG_ID = "produto-schema";

// Descreve o produto em JSON-LD (padrão schema.org), que é como o Google
// entende preço, disponibilidade e desconto.
//
// O efeito prático: em vez de só o título e a descrição, o resultado da busca
// pode mostrar "R$ 15,00 · Em estoque" direto na lista. Isso aumenta o clique
// sem precisar subir de posição.
//
// Funciona num site como este porque o Google executa JavaScript antes de
// indexar. O mesmo NÃO vale para o WhatsApp e o Facebook — veja a observação
// no README sobre pré-renderização.
export function useProductSchema(product) {
  useEffect(() => {
    if (!product) return undefined;

    const discount = getDiscount(product);
    const url = `${window.location.origin}/produto/${product.id}`;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || `${product.name} na SilBeauty.`,
      url,
      ...(product.image ? { image: [product.image] } : {}),
      ...(product.category ? { category: product.category } : {}),
      brand: { "@type": "Brand", name: "SilBeauty" },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "BRL",
        // O Google exige o preço como número com ponto decimal.
        price: Number(product.price || 0).toFixed(2),
        availability: isOutOfStock(product)
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "SilBeauty" },
      },
      ...(discount
        ? {
            // Preço de referência anterior, que permite ao Google exibir o
            // desconto em vez de só o preço final.
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceType: "https://schema.org/ListPrice",
              price: Number(discount.oldPrice).toFixed(2),
              priceCurrency: "BRL",
            },
          }
        : {}),
    };

    // Uma única tag reaproveitada: navegar entre produtos trocaria o conteúdo,
    // não acumularia blocos duplicados (o que o Google trata como erro).
    let tag = document.getElementById(TAG_ID);
    if (!tag) {
      tag = document.createElement("script");
      tag.type = "application/ld+json";
      tag.id = TAG_ID;
      document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify(schema);

    return () => {
      // Sai da página do produto, sai o schema: deixá-lo em outra rota
      // descreveria a página errada.
      document.getElementById(TAG_ID)?.remove();
    };
  }, [product]);
}
