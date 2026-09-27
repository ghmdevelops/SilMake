// Recebe o aviso do Mercado Pago quando um pagamento muda de situação.
//
// ---------------------------------------------------------------------------
// De onde vem a segurança aqui
// ---------------------------------------------------------------------------
//
// O conteúdo do aviso NUNCA é usado para decidir nada. Dele tiramos apenas um
// número: "olhe o pagamento tal". Em seguida consultamos esse pagamento
// direto na API do Mercado Pago, com o nosso Access Token, e só a resposta de
// lá vale.
//
// Isso é o que torna o fluxo seguro, e não a assinatura. Quem inventasse um
// aviso só conseguiria nos fazer consultar um id: se o pagamento não for da
// nossa conta, a API responde 404; se não apontar para um pedido nosso, paramos;
// se o valor não cobrir o pedido, paramos. Marcar como pago só acontece se o
// dinheiro entrou de verdade.
//
// A assinatura continua sendo conferida, mas como VERIFICAÇÃO, não como
// porteiro. A razão é concreta: um detalhe errado no formato do texto assinado
// já derrubou toda a confirmação de pagamento desta loja, em silêncio —
// pagamentos entravam e os pedidos ficavam pendentes. Um detalhe de formatação
// não pode ter esse poder. Quando a assinatura não confere, registramos alto e
// seguimos pela fonte confiável.

import { createHmac } from "node:crypto";
import { getConfig, jsonResponse, mpFetch } from "./lib/mercadoPago.mjs";
import { applyPaymentToOrder } from "./lib/applyPayment.mjs";
import { sendTelegram } from "./lib/telegram.mjs";

// Confere a assinatura conforme a documentação do Mercado Pago. O cabeçalho
// vem como "ts=1704908010,v1=618c8534...".
//
// Detalhe que custa caro: o id usado no texto assinado é o que vem na QUERY
// da URL (?data.id=...), em minúsculas — não o do corpo da requisição.
function checarAssinatura(request, dataIdDoCorpo) {
  const { webhookSecret } = getConfig();
  if (!webhookSecret) return { ok: false, motivo: "sem_segredo" };

  const header = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";

  const parts = Object.fromEntries(
    header
      .split(",")
      .map((p) => p.split("=").map((s) => s.trim()))
      .filter((p) => p.length === 2)
  );
  if (!parts.ts || !parts.v1) return { ok: false, motivo: "cabecalho_invalido" };

  let dataId = dataIdDoCorpo;
  try {
    const daQuery = new URL(request.url).searchParams.get("data.id");
    if (daQuery) dataId = daQuery;
  } catch {
    // URL malformada: segue com o id do corpo.
  }

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const esperado = createHmac("sha256", webhookSecret).update(manifest).digest("hex");

  if (esperado !== parts.v1) {
    return { ok: false, motivo: "nao_confere", manifest };
  }
  return { ok: true };
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const { configured, dbSecret } = getConfig();
  if (!configured || !dbSecret) {
    console.error("Webhook chamado sem MP_ACCESS_TOKEN ou FIREBASE_DB_SECRET.");
    await sendTelegram(
      "⚠️ SilBeauty: chegou um aviso de pagamento, mas o servidor está sem as credenciais configuradas. Nenhum pedido foi confirmado."
    );
    return jsonResponse({ error: "not_configured" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const tipo = body?.type || body?.topic;
  if (tipo !== "payment") {
    return jsonResponse({ ignored: tipo || "sem tipo" });
  }

  const paymentId = String(body?.data?.id || body?.["data.id"] || "").trim();
  if (!paymentId) {
    return jsonResponse({ error: "missing_payment_id" }, 400);
  }

  // A assinatura é conferida e registrada, mas não interrompe o fluxo.
  const assinatura = checarAssinatura(request, paymentId);
  if (!assinatura.ok) {
    console.error(
      `Assinatura do webhook não confere (${assinatura.motivo}). ` +
        `manifest="${assinatura.manifest || "-"}". ` +
        "Seguindo pela consulta direta à API, que é a fonte confiável."
    );
  }

  // A fonte da verdade: consulta com o nosso token. Se o pagamento não for da
  // nossa conta, a resposta é 404 e nada acontece.
  const { ok, status, data: payment } = await mpFetch(`/v1/payments/${paymentId}`);
  if (!ok) {
    if (status === 404) {
      // Id que não existe na nossa conta: provavelmente um aviso forjado.
      console.error(`Pagamento ${paymentId} não pertence a esta conta. Ignorado.`);
      return jsonResponse({ ignored: "payment_not_found" });
    }
    console.error("Não foi possível consultar o pagamento:", status, payment);
    // 500 faz o Mercado Pago tentar de novo mais tarde, que é o desejado.
    return jsonResponse({ error: "payment_read_failed" }, 500);
  }

  const { resultado, status: statusPedido } = await applyPaymentToOrder(payment, {
    origem: assinatura.ok ? "webhook" : "webhook (assinatura não confere)",
  });

  // Avisa quando o pagamento entrou mas a assinatura falhou: está funcionando,
  // porém há algo para corrigir na configuração.
  if (!assinatura.ok && resultado === "pago") {
    await sendTelegram(
      "ℹ️ O pedido acima foi confirmado pela conferência direta. A assinatura do webhook não bateu — vale revisar MP_WEBHOOK_SECRET (a de teste e a de produção são diferentes)."
    );
  }

  return jsonResponse({ resultado, status: statusPedido });
}
