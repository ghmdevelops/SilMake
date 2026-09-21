import { toQuoteItem } from "../utils/packaging";

// Endereço da função serverless (veja netlify.toml). Em desenvolvimento com
// `npm run dev` essa rota não existe — tratamos isso como "cotação
// indisponível" e a loja usa o frete de reserva.
const QUOTE_URL = "/api/shipping-quote";

// Pede ao servidor as opções reais de frete (PAC, SEDEX, Jadlog...).
// Retorna { options } em caso de sucesso, ou { unavailable: true, reason }
// quando não há cotação — nunca lança, para não derrubar o carrinho.
export async function fetchShippingQuote({ originCep, destinationCep, items }) {
  if (!originCep) return { unavailable: true, reason: "sem_cep_origem" };
  if (!items?.length) return { unavailable: true, reason: "carrinho_vazio" };

  try {
    const response = await fetch(QUOTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: originCep,
        to: destinationCep,
        products: items.map(toQuoteItem),
      }),
    });

    // 404 = rodando sem o Netlify (dev local). 503 = token não configurado.
    if (response.status === 404) return { unavailable: true, reason: "sem_funcao" };

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        unavailable: true,
        reason: data.error || "erro",
        message: data.message,
      };
    }

    if (!data.options?.length) return { unavailable: true, reason: "sem_opcoes" };

    return { options: data.options };
  } catch (err) {
    console.error("Falha ao cotar o frete:", err);
    return { unavailable: true, reason: "rede" };
  }
}
