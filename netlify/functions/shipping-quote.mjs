// Cotação de frete via Melhor Envio.
//
// Por que isso é uma função no servidor e não código no site: as credenciais
// dão acesso à sua conta. No JavaScript da loja, qualquer visitante poderia
// lê-las. Além disso a API deles bloqueia chamadas do navegador (CORS).
//
// A autenticação aceita dois modos — token fixo do painel ou OAuth2 — e está
// toda em lib/melhorEnvio.mjs.

import { getConfig, getValidAccessToken, jsonResponse } from "./lib/melhorEnvio.mjs";

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

async function callCalculator({ token, from, to, products }) {
  const { baseUrl, userAgent } = getConfig();

  return fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      // O Melhor Envio exige identificação da aplicação.
      "User-Agent": userAgent,
    },
    body: JSON.stringify({
      from: { postal_code: from },
      to: { postal_code: to },
      products: products.map((item) => ({
        id: String(item.id),
        width: Number(item.width),
        height: Number(item.height),
        length: Number(item.length),
        weight: Number(item.weight),
        insurance_value: Number(item.insurance_value) || 0,
        quantity: Number(item.quantity) || 1,
      })),
      options: { receipt: false, own_hand: false },
    }),
  });
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const { clientId, clientSecret, directToken } = getConfig();
  // Com token fixo do painel, client id/secret não são usados para cotar.
  if (!directToken && (!clientId || !clientSecret)) {
    return jsonResponse(
      { error: "not_configured", message: "Credenciais do Melhor Envio não configuradas." },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const from = onlyDigits(body?.from);
  const to = onlyDigits(body?.to);
  const products = Array.isArray(body?.products) ? body.products : [];

  if (from.length !== 8) {
    return jsonResponse(
      { error: "invalid_origin", message: "CEP de origem não configurado." },
      400
    );
  }
  if (to.length !== 8) {
    return jsonResponse(
      { error: "invalid_destination", message: "CEP de destino inválido." },
      400
    );
  }
  if (products.length === 0) {
    return jsonResponse({ error: "empty_cart", message: "Nenhum produto para cotar." }, 400);
  }

  // Renova sozinho se o token estiver perto de vencer.
  let token = await getValidAccessToken();
  if (!token) {
    return jsonResponse(
      {
        error: "not_connected",
        message: "A loja ainda não autorizou a conta do Melhor Envio.",
      },
      503
    );
  }

  try {
    let response = await callCalculator({ token, from, to, products });

    // Token recusado: força uma renovação e tenta de novo, uma única vez.
    if (response.status === 401) {
      // Token fixo não tem renovação. Recusa aqui quase sempre significa
      // token de sandbox com a loja em produção (ou o contrário), ou token
      // revogado no painel. Sem essa mensagem o erro viraria um 502 genérico.
      if (directToken) {
        return jsonResponse(
          {
            error: "invalid_token",
            message:
              "O Melhor Envio recusou o token. Confira se ele foi gerado no mesmo ambiente definido em MELHOR_ENVIO_ENV.",
          },
          503
        );
      }

      token = await getValidAccessToken({ force: true });
      if (!token) {
        return jsonResponse(
          { error: "not_connected", message: "Autorização do Melhor Envio expirou." },
          503
        );
      }
      response = await callCalculator({ token, from, to, products });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("Melhor Envio respondeu com erro:", response.status, data);
      return jsonResponse(
        { error: "quote_failed", message: data?.message || "Não foi possível cotar o frete." },
        502
      );
    }

    // A resposta traz todos os serviços, inclusive os indisponíveis para o
    // trajeto (que vêm com "error"). Devolvemos só os cotáveis. Os campos
    // "custom_" já refletem os descontos da sua conta, por isso têm prioridade.
    const options = (Array.isArray(data) ? data : [])
      .filter((service) => !service?.error && Number(service?.custom_price ?? service?.price) > 0)
      .map((service) => ({
        id: String(service.id),
        name: service.name,
        company: service.company?.name || "",
        price: Number(service.custom_price ?? service.price),
        days: Number(service.custom_delivery_time ?? service.delivery_time) || 0,
      }))
      .sort((a, b) => a.price - b.price);

    return jsonResponse({ options });
  } catch (err) {
    console.error("Falha ao consultar o Melhor Envio:", err);
    return jsonResponse({ error: "network", message: "Não foi possível cotar o frete agora." }, 502);
  }
}
