// Aplica um pagamento do Mercado Pago a um pedido: confere o valor, marca
// como pago, baixa o estoque e avisa no Telegram.
//
// Fica separado porque DOIS caminhos chegam aqui, de propósito:
//
//   1. mp-webhook    — o aviso que o Mercado Pago envia sozinho
//   2. mp-sync-order — a conferência que a loja faz por conta própria
//
// Ter os dois é o que impede o problema que já aconteceu: um detalhe errado
// na validação da assinatura derrubou a confirmação inteira, em silêncio. Com
// o segundo caminho, o pedido se resolve mesmo que o aviso nunca chegue.

import { readOrder, patchOrder, decrementStock, restoreStock } from "./mercadoPago.mjs";
import {
  sendTelegram,
  nomeDoMeio,
  formatarPreco,
  formatarDataHora,
} from "./telegram.mjs";

// Situações em que o dinheiro sai da sua conta depois de ter entrado. Todas
// exigem devolver o estoque.
const DEVOLVEM_DINHEIRO = ["refunded", "charged_back", "cancelled"];

// Situações em que ainda não há dinheiro: Pix gerado e não pago, boleto
// aguardando compensação, análise antifraude.
const AGUARDANDO = ["pending", "in_process", "authorized"];

const ROTULOS = {
  refunded: "Pagamento estornado",
  charged_back: "Contestação de cartão",
  cancelled: "Pagamento cancelado",
  in_mediation: "Pagamento em disputa",
  rejected: "Pagamento recusado",
  pending: "Aguardando pagamento",
  in_process: "Pagamento em análise",
  authorized: "Pagamento autorizado, aguardando captura",
  approved: "Pagamento aprovado",
};

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

// Mensagem do Telegram. Chega só quando o pagamento entrou, então traz tudo
// o que é preciso para separar e despachar sem abrir o painel.
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

  if (problemasDeEstoque.length > 0) {
    linhas.push("", `⚠️ Conferir estoque: ${problemasDeEstoque.join(", ")}`);
  }

  return linhas.join("\n");
}

// Recebe o pagamento JÁ consultado na API do Mercado Pago — nunca o conteúdo
// de um aviso. Devolve { resultado, motivo } para quem chamou decidir a
// resposta HTTP.
export async function applyPaymentToOrder(payment, { origem = "webhook" } = {}) {
  const referencia = String(payment.external_reference || "");
  const [uid, orderId] = referencia.split("|");

  if (!uid || !orderId) {
    console.error("Pagamento sem referência de pedido:", referencia);
    return { resultado: "sem_referencia" };
  }

  let order;
  try {
    order = await readOrder(uid, orderId);
  } catch (err) {
    console.error("Falha ao ler o pedido:", err);
    return { resultado: "erro_leitura" };
  }

  if (!order) {
    console.error("Pedido não encontrado:", referencia);
    return { resultado: "pedido_nao_encontrado" };
  }

  const dados = {
    paymentId: String(payment.id),
    paymentStatus: payment.status,
    paymentMethod: payment.payment_type_id || "",
    paidAt: payment.date_approved || null,
  };

  // -------------------------------------------------------------------------
  // Dinheiro que volta: estorno, contestação ou cancelamento após a venda
  // -------------------------------------------------------------------------
  if (DEVOLVEM_DINHEIRO.includes(payment.status)) {
    const jaFoiPago = order.status && order.status !== "pending";
    // stockReturned trava a devolução: o Mercado Pago reenvia o mesmo aviso,
    // e sem isso o estoque subiria a cada reenvio.
    const precisaDevolver = jaFoiPago && !order.stockReturned;

    const problemas = precisaDevolver ? await restoreStock(order.items || []) : [];

    await patchOrder(uid, orderId, {
      ...dados,
      // O pedido sai de "pago": o dinheiro não está mais com você. Volta para
      // pendente para aparecer entre os que precisam de atenção.
      ...(jaFoiPago ? { status: "pending" } : {}),
      ...(precisaDevolver ? { stockReturned: true } : {}),
      paymentAlert: `${ROTULOS[payment.status]} em ${formatarDataHora(payment.date_last_updated) || "agora"}`,
    });

    await sendTelegram(
      [
        `${payment.status === "charged_back" ? "🚨" : "↩️"} ${ROTULOS[payment.status].toUpperCase()} — pedido #${order.orderNumber || orderId}`,
        "",
        `Valor: ${formatarPreco(payment.transaction_amount)}`,
        `Meio: ${nomeDoMeio(payment.payment_type_id)}`,
        "",
        precisaDevolver
          ? "O estoque foi devolvido automaticamente."
          : "Nenhum estoque a devolver (o pedido não estava pago).",
        problemas.length > 0 ? `⚠️ Conferir: ${problemas.join(", ")}` : "",
        payment.status === "charged_back"
          ? "Contestação de cartão: responda no painel do Mercado Pago dentro do prazo, ou o valor é retirado."
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );

    return { resultado: "devolvido", status: payment.status };
  }

  // -------------------------------------------------------------------------
  // Disputa aberta: o dinheiro ainda está com você, mas pode sair
  // -------------------------------------------------------------------------
  if (payment.status === "in_mediation") {
    // Não devolve estoque nem muda o status: o produto provavelmente já foi
    // enviado, e a disputa pode ser ganha. Mas você precisa saber AGORA,
    // porque há prazo para responder.
    await patchOrder(uid, orderId, {
      ...dados,
      paymentAlert: "Pagamento em disputa no Mercado Pago",
    });
    await sendTelegram(
      `🚨 DISPUTA ABERTA — pedido #${order.orderNumber || orderId}\n\n` +
        `Valor: ${formatarPreco(payment.transaction_amount)}\n\n` +
        "Responda no painel do Mercado Pago dentro do prazo. Sem resposta, o valor é devolvido à cliente."
    );
    return { resultado: "disputa" };
  }

  // -------------------------------------------------------------------------
  // Em análise ou aguardando compensação (Pix e boleto não pagos ainda)
  // -------------------------------------------------------------------------
  if (AGUARDANDO.includes(payment.status)) {
    // Só registra. O pedido continua pendente, que é a situação correta — e a
    // cliente vê "aguardando confirmação" no histórico dela.
    await patchOrder(uid, orderId, dados);
    return { resultado: "aguardando", status: payment.status };
  }

  // -------------------------------------------------------------------------
  // Recusado
  // -------------------------------------------------------------------------
  if (payment.status === "rejected") {
    // Sem aviso no Telegram de propósito: cartão recusado é comum, a cliente
    // costuma tentar de novo em seguida, e você receberia mensagem de cada
    // tentativa. Fica registrado no pedido, visível no painel.
    await patchOrder(uid, orderId, {
      ...dados,
      paymentAlert: `Pagamento recusado${payment.status_detail ? ` (${payment.status_detail})` : ""}`,
    });
    return { resultado: "recusado", detalhe: payment.status_detail };
  }

  if (payment.status !== "approved") {
    // Situação nova ou desconhecida: registra e não age. Melhor não fazer
    // nada do que agir errado com dinheiro.
    console.warn(`Situação de pagamento não mapeada: ${payment.status}`);
    await patchOrder(uid, orderId, dados);
    return { resultado: "registrado", status: payment.status };
  }

  // Confere o valor. Protege contra uma cobrança adulterada ter sido paga por
  // um valor menor que o do pedido.
  const pago = Number(payment.transaction_amount || 0);
  const esperado = Number(order.total || 0);
  if (pago + 0.01 < esperado) {
    console.error(`Valor pago (${pago}) menor que o do pedido (${esperado}).`);
    await patchOrder(uid, orderId, {
      ...dados,
      paymentAlert: `Pago ${formatarPreco(pago)} para um pedido de ${formatarPreco(esperado)}`,
    });
    await sendTelegram(
      `⚠️ Pedido #${order.orderNumber || orderId}: pago ${formatarPreco(pago)} para um total de ${formatarPreco(esperado)}. Confira no Mercado Pago antes de enviar.`
    );
    return { resultado: "valor_divergente" };
  }

  // O Mercado Pago reenvia o mesmo aviso várias vezes, e a conferência pode
  // rodar junto. Só agimos na transição — sem isto, o estoque seria baixado
  // de novo e você receberia o aviso repetido.
  if (order.status && order.status !== "pending") {
    return { resultado: "ja_processado", status: order.status };
  }

  const problemas = await decrementStock(order.items || []);
  await patchOrder(uid, orderId, {
    ...dados,
    status: "paid",
    // Limpa marcas de tentativas anteriores: um pagamento aprovado depois de
    // uma recusa não deve continuar exibindo "recusado" no painel. E se o
    // estoque tinha sido devolvido por um estorno, agora ele sai de novo.
    paymentAlert: null,
    stockReturned: null,
    ...(problemas.length > 0 ? { stockAlert: problemas.join(", ") } : {}),
  });

  console.log(
    `Pedido ${order.orderNumber || orderId} confirmado como pago (via ${origem}).`
  );
  await sendTelegram(montarAviso(order, payment, problemas));

  return { resultado: "pago", orderNumber: order.orderNumber };
}
