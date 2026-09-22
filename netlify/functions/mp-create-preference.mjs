// Cria a cobrança no Mercado Pago e devolve o link de pagamento.
//
// O cliente é levado para o checkout do Mercado Pago (Checkout Pro), paga por
// Pix, cartão ou boleto, e volta para a loja. A confirmação NÃO vem dessa
// volta — vem do webhook, porque a volta pode não acontecer (o cliente fecha
// a aba) e porque um endereço de retorno pode ser forjado.

import { getConfig, jsonResponse, getSiteUrl, mpFetch, readOrder } from "./lib/mercadoPago.mjs";

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const { configured, dbSecret } = getConfig();
  if (!configured) {
    return jsonResponse(
      { error: "not_configured", message: "MP_ACCESS_TOKEN não configurado." },
      503
    );
  }
  if (!dbSecret) {
    return jsonResponse(
      { error: "not_configured", message: "FIREBASE_DB_SECRET não configurado." },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const uid = String(body?.uid || "").trim();
  const orderId = String(body?.orderId || "").trim();

  if (!uid || !orderId) {
    return jsonResponse({ error: "missing_order" }, 400);
  }

  // O valor vem do BANCO, nunca do navegador. Se viesse do cliente, bastaria
  // editar a requisição para pagar R$ 0,01 por um pedido de R$ 200.
  let order;
  try {
    order = await readOrder(uid, orderId);
  } catch (err) {
    console.error("Não foi possível ler o pedido:", err);
    return jsonResponse({ error: "order_read_failed" }, 502);
  }

  if (!order) {
    return jsonResponse({ error: "order_not_found" }, 404);
  }
  if (order.status && order.status !== "pending") {
    // Evita gerar uma segunda cobrança para algo já pago.
    return jsonResponse({ error: "order_not_payable", status: order.status }, 409);
  }

  const site = getSiteUrl(request);
  const items = (order.items || []).map((item) => ({
    id: String(item.id || ""),
    title: String(item.name || "Produto").slice(0, 250),
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.price) || 0,
    currency_id: "BRL",
  }));

  const shipping = Number(order.shippingFee) || 0;

  const preference = {
    items,
    // O frete entra como um item à parte: o Mercado Pago só soma itens, e
    // assim o cliente vê o frete discriminado no checkout.
    ...(shipping > 0
      ? {
          shipments: {
            cost: shipping,
            mode: "not_specified",
          },
        }
      : {}),
    payer: {
      name: String(order.customerName || "").slice(0, 100),
      email: String(order.customerEmail || "").slice(0, 100),
    },
    // Volta o cliente para o histórico, onde o status aparece em tempo real.
    back_urls: {
      success: `${site}/meus-pedidos?pagamento=sucesso`,
      pending: `${site}/meus-pedidos?pagamento=pendente`,
      failure: `${site}/meus-pedidos?pagamento=falhou`,
    },
    auto_return: "approved",
    // É por aqui que o webhook sabe qual pedido atualizar.
    external_reference: `${uid}|${orderId}`,
    notification_url: `${site}/api/mp-webhook`,
    statement_descriptor: "SILBEAUTY",
  };

  const { ok, status, data } = await mpFetch("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(preference),
  });

  if (!ok) {
    console.error("Mercado Pago recusou a preferência:", status, data);
    return jsonResponse(
      { error: "preference_failed", message: data?.message || "Falha ao criar a cobrança." },
      502
    );
  }

  return jsonResponse({
    // sandbox_init_point serve apenas para a credencial antiga "TEST-". Com
    // usuário de teste (APP_USR-), o checkout correto é o init_point normal:
    // o ambiente de teste é a própria conta, não uma URL diferente.
    checkoutUrl: getConfig().isLegacySandbox
      ? data.sandbox_init_point
      : data.init_point,
    preferenceId: data.id,
  });
}
