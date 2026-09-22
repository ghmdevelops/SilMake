// Recebe o aviso do Mercado Pago quando um pagamento muda de situação.
//
// Esta é a única fonte de verdade sobre "o pedido foi pago". A volta do
// cliente ao site NÃO serve para isso: ele pode fechar a aba antes, e o
// endereço de retorno pode ser digitado por qualquer pessoa.
//
// Duas travas de segurança aqui:
//
// 1. A assinatura do aviso é conferida (cabeçalho x-signature). Sem isso,
//    qualquer um poderia chamar este endereço dizendo "o pedido X foi pago".
//
// 2. Mesmo com assinatura válida, o conteúdo do aviso NÃO é usado para
//    decidir nada. Nós consultamos o pagamento direto na API do Mercado Pago
//    e acreditamos apenas nessa resposta.

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  getConfig,
  jsonResponse,
  mpFetch,
  readOrder,
  patchOrder,
  decrementStock,
} from "./lib/mercadoPago.mjs";
import {
  sendTelegram,
  nomeDoMeio,
  formatarPreco,
  formatarDataHora,
} from "./lib/telegram.mjs";

// Confere a assinatura conforme a documentação do Mercado Pago. O cabeçalho
// vem como "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839".
function signatureIsValid(request, dataId) {
  const { webhookSecret } = getConfig();

  // Sem segredo configurado não há como validar. Recusamos em vez de
  // confiar: um webhook aberto é um caminho para marcar pedidos como pagos.
  if (!webhookSecret) return false;

  const header = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";

  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=").map((s) => s.trim()))
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // O texto assinado tem formato fixo, definido pelo Mercado Pago.
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const esperado = createHmac("sha256", webhookSecret).update(manifest).digest("hex");

  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(v1, "utf8");
  if (a.length !== b.length) return false;
  // Comparação de tempo constante: evita descobrir a assinatura por tentativa.
  return timingSafeEqual(a, b);
}

function formatarEndereco(address) {
  if (!address || !address.street) return "";
  const { street, number, complement, neighborhood, city, state, zipCode } = address;
  return [
    [street, number].filter(Boolean).join(", "),
    complement,
    [neighborhood, city, state].filter(Boolean).join(" - "),
    zipCode,
  ]
    .filter(Boolean)
    .join("\n");
}

// Mensagem do Telegram. Chega só quando o pagamento entrou, então ela traz
// tudo o que você precisa para separar e despachar sem abrir o painel.
function montarAviso(order, payment, problemasDeEstoque) {
  const itens = (order.items || []).map(
    (i) => `• ${i.name} (x${i.quantity}) — ${formatarPreco(i.price * i.quantity)}`
  );

  const linhas = [
    `💰 PAGAMENTO CONFIRMADO — pedido #${order.orderNumber || ""}`,
    "",
    ...itens,
    "",
    `Subtotal: ${formatarPreco(order.subtotal)}`,
    `Frete: ${order.shippingFee > 0 ? formatarPreco(order.shippingFee) : "Grátis"}`,
    `Total pago: ${formatarPreco(payment.transaction_amount)}`,
    "",
    `Meio: ${nomeDoMeio(payment.payment_type_id)}`,
    `Pago em: ${formatarDataHora(payment.date_approved) || "agora"}`,
  ];

  if (order.shippingService) linhas.push(`Envio: ${order.shippingService}`);

  const endereco = formatarEndereco(order.address);
  if (endereco) linhas.push("", "Endereço de entrega:", endereco);

  linhas.push("", `Cliente: ${order.customerName || order.customerEmail || "—"}`);
  if (order.customerEmail) linhas.push(`E-mail: ${order.customerEmail}`);

  // Divergência de estoque precisa aparecer aqui: é o momento em que você
  // ainda pode avisar a cliente antes de prometer o envio.
  if (problemasDeEstoque.length > 0) {
    linhas.push("", `⚠️ Conferir estoque: ${problemasDeEstoque.join(", ")}`);
  }

  return linhas.join("\n");
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const { configured, dbSecret } = getConfig();
  if (!configured || !dbSecret) {
    console.error("Webhook chamado sem MP_ACCESS_TOKEN ou FIREBASE_DB_SECRET.");
    return jsonResponse({ error: "not_configured" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  // Só nos interessam avisos de pagamento.
  const tipo = body?.type || body?.topic;
  if (tipo !== "payment") {
    return jsonResponse({ ignored: tipo || "sem tipo" });
  }

  const paymentId = String(body?.data?.id || body?.["data.id"] || "").trim();
  if (!paymentId) {
    return jsonResponse({ error: "missing_payment_id" }, 400);
  }

  if (!signatureIsValid(request, paymentId)) {
    console.error("Assinatura do webhook inválida. Aviso descartado.");
    return jsonResponse({ error: "invalid_signature" }, 401);
  }

  // Consulta na fonte. O corpo do aviso não é usado para decidir.
  const { ok, status, data: payment } = await mpFetch(`/v1/payments/${paymentId}`);
  if (!ok) {
    console.error("Não foi possível consultar o pagamento:", status, payment);
    // 500 faz o Mercado Pago tentar de novo mais tarde, que é o desejado.
    return jsonResponse({ error: "payment_read_failed" }, 500);
  }

  const referencia = String(payment.external_reference || "");
  const [uid, orderId] = referencia.split("|");
  if (!uid || !orderId) {
    console.error("Pagamento sem referência de pedido:", referencia);
    return jsonResponse({ error: "missing_reference" }, 400);
  }

  let order;
  try {
    order = await readOrder(uid, orderId);
  } catch (err) {
    console.error("Falha ao ler o pedido:", err);
    return jsonResponse({ error: "order_read_failed" }, 500);
  }

  if (!order) {
    console.error("Pedido não encontrado:", referencia);
    return jsonResponse({ error: "order_not_found" }, 404);
  }

  // Confere o valor. Protege contra uma cobrança adulterada ter sido paga
  // por um valor menor que o do pedido.
  const pago = Number(payment.transaction_amount || 0);
  const esperado = Number(order.total || 0);
  if (payment.status === "approved" && pago + 0.01 < esperado) {
    console.error(`Valor pago (${pago}) menor que o do pedido (${esperado}).`);
    await patchOrder(uid, orderId, {
      paymentAlert: `Pago ${pago} para um pedido de ${esperado}`,
      paymentId,
    });
    return jsonResponse({ error: "amount_mismatch" }, 200);
  }

  const dados = {
    paymentId,
    paymentStatus: payment.status,
    paymentMethod: payment.payment_type_id || "",
    paidAt: payment.date_approved || null,
  };

  // O Mercado Pago reenvia o mesmo aviso várias vezes. Só agimos na
  // transição — sem isso, o estoque seria baixado a cada reenvio.
  const jaEstavaPago = order.status && order.status !== "pending";

  if (payment.status === "approved" && !jaEstavaPago) {
    const problemas = await decrementStock(order.items || []);
    await patchOrder(uid, orderId, {
      ...dados,
      status: "paid",
      ...(problemas.length > 0 ? { stockAlert: problemas.join(", ") } : {}),
    });
    console.log(`Pedido ${order.orderNumber || orderId} confirmado como pago.`);

    // O aviso sai daqui, e não do carrinho, porque aqui é o único ponto onde
    // se sabe que o dinheiro entrou. Avisar na criação do pedido encheria o
    // seu Telegram de carrinhos abandonados.
    await sendTelegram(montarAviso(order, payment, problemas));

    return jsonResponse({ updated: "paid" });
  }

  // Recusado ou estornado: registramos, mas não mexemos no status. Quem
  // decide encerrar o pedido é você, no painel.
  await patchOrder(uid, orderId, dados);
  return jsonResponse({ updated: payment.status });
}
