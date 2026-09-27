// Confere na fonte se um pedido foi pago, e atualiza se foi.
//
// Esta é a rede de segurança do pagamento. O webhook é ótimo quando funciona,
// mas depende de o Mercado Pago conseguir alcançar o servidor, da assinatura
// estar certa e das variáveis estarem no lugar. Quando qualquer uma dessas
// coisas falha, o dinheiro entra e o pedido fica pendente — foi o que já
// aconteceu aqui.
//
// Com esta função, a loja pergunta em vez de esperar. Ela roda:
//   - quando a cliente volta do checkout
//   - quando você aperta "Verificar pagamento" no painel
//
// Não recebe nada além do identificador do pedido: o status vem sempre da
// resposta do Mercado Pago, nunca do navegador.

import { getConfig, jsonResponse, mpFetch, readOrder } from "./lib/mercadoPago.mjs";
import { applyPaymentToOrder } from "./lib/applyPayment.mjs";

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const { configured, dbSecret } = getConfig();
  if (!configured || !dbSecret) {
    return jsonResponse({ error: "not_configured" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const uid = String(body?.uid || "").trim();
  const orderId = String(body?.orderId || "").trim();
  if (!uid || !orderId) return jsonResponse({ error: "missing_order" }, 400);

  const order = await readOrder(uid, orderId).catch(() => null);
  if (!order) return jsonResponse({ error: "order_not_found" }, 404);

  // Já resolvido: nada a fazer. Responder cedo evita consulta desnecessária
  // à API a cada carregamento de página.
  if (order.status && order.status !== "pending") {
    return jsonResponse({ resultado: "ja_processado", status: order.status });
  }

  // Procura o pagamento pela referência que gravamos na cobrança. É assim
  // que achamos o pagamento sem depender de o webhook ter chegado.
  const referencia = `${uid}|${orderId}`;
  const { ok, status, data } = await mpFetch(
    `/v1/payments/search?external_reference=${encodeURIComponent(referencia)}&sort=date_created&criteria=desc`
  );

  if (!ok) {
    console.error("Busca de pagamento falhou:", status, data);
    return jsonResponse({ error: "search_failed" }, 502);
  }

  const pagamentos = data?.results || [];
  if (pagamentos.length === 0) {
    return jsonResponse({ resultado: "sem_pagamento" });
  }

  // Entre várias tentativas (cartão recusado e depois Pix, por exemplo), a
  // aprovada é a que importa.
  const aprovado = pagamentos.find((p) => p.status === "approved");
  const alvo = aprovado || pagamentos[0];

  const resultado = await applyPaymentToOrder(alvo, { origem: "conferência" });
  return jsonResponse(resultado);
}
