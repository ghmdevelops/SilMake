// Testa a lógica do webhook de pagamento SEM internet e SEM dinheiro.
//
// Rode com: node scripts/test-mp-webhook.mjs
//
// Por que existe: o webhook é o código que decide "este pedido foi pago". Um
// erro ali pode liberar produto sem pagamento, ou baixar estoque duas vezes.
// É a parte do projeto onde não se pode confiar em "parece certo".
//
// Aqui o Mercado Pago e o Firebase são substituídos por dublês: interceptamos
// o fetch e devolvemos respostas controladas. Assim é possível forçar casos
// que seriam difíceis de reproduzir na mão — assinatura forjada, aviso
// repetido, valor pago menor que o do pedido.

import { createHmac } from "node:crypto";

const SECRET = "segredo-de-teste";

process.env.MP_ACCESS_TOKEN = "APP_USR-token-de-teste";
process.env.MP_WEBHOOK_SECRET = SECRET;
process.env.FIREBASE_DB_SECRET = "segredo-firebase-de-teste";

// ---------------------------------------------------------------------------
// Dublês de Mercado Pago e Firebase
// ---------------------------------------------------------------------------

process.env.TELEGRAM_BOT_TOKEN = "token-de-teste";
process.env.TELEGRAM_CHAT_ID = "123";

let banco;
let pagamento;
let escritas;
let avisosTelegram;
// Simula um id que não pertence à nossa conta: a API responde 404.
let pagamentoNaoEncontrado = false;

function resetarCenario({ statusDoPedido = "pending", valorPago = 100 } = {}) {
  escritas = [];
  avisosTelegram = [];
  banco = {
    "orders/user1/order1": {
      orderNumber: "202609081234",
      status: statusDoPedido,
      total: 100,
      subtotal: 100,
      shippingFee: 0,
      customerName: "Maria Teste",
      customerEmail: "maria@exemplo.com",
      address: { street: "Rua A", number: "10", city: "São Paulo", state: "SP", zipCode: "01000-000" },
      items: [
        { id: "prod1", name: "Batom", price: 50, quantity: 2 },
      ],
    },
    "products/prod1/stock": 10,
  };
  pagamento = {
    id: "12345",
    status: "approved",
    transaction_amount: valorPago,
    external_reference: "user1|order1",
    // Valor real da API para Pix. O "pix" que se esperaria aqui vai em
    // payment_method_id, que é outro campo.
    payment_type_id: "bank_transfer",
    date_approved: "2026-09-22T10:00:00.000Z",
  };
}

globalThis.fetch = async (url, options = {}) => {
  const endereco = String(url);
  const metodo = options.method || "GET";

  // --- Telegram ---
  if (endereco.includes("api.telegram.org")) {
    avisosTelegram.push(JSON.parse(options.body).text);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // --- Mercado Pago ---
  if (endereco.includes("api.mercadopago.com")) {
    if (endereco.includes("/v1/payments/")) {
      if (pagamentoNaoEncontrado) {
        return new Response(JSON.stringify({ message: "Payment not found" }), { status: 404 });
      }
      return new Response(JSON.stringify(pagamento), { status: 200 });
    }
    return new Response(JSON.stringify({ nickname: "TESTUSER123" }), { status: 200 });
  }

  // --- Firebase (REST) ---
  // O caminho vem como .../orders/user1/order1.json?auth=...
  const caminho = endereco
    .replace(/^https:\/\/[^/]+\//, "")
    .replace(/\.json.*$/, "");

  if (metodo === "GET") {
    const valor = banco[caminho];
    return new Response(JSON.stringify(valor === undefined ? null : valor), { status: 200 });
  }

  const corpo = options.body ? JSON.parse(options.body) : null;
  escritas.push({ caminho, metodo, corpo });

  if (metodo === "PATCH") {
    banco[caminho] = { ...(banco[caminho] || {}), ...corpo };
  } else if (metodo === "PUT") {
    banco[caminho] = corpo;
  }

  return new Response(JSON.stringify(corpo), { status: 200 });
};

// Importado só depois dos dublês, senão pegaria o fetch real.
const { default: handler } = await import("../netlify/functions/mp-webhook.mjs");

// ---------------------------------------------------------------------------
// Montagem da requisição
// ---------------------------------------------------------------------------

// `idNaQuery` permite simular o que o Mercado Pago realmente faz: ele
// acrescenta ?data.id=... na URL, e é ESSE id que entra no texto assinado.
function montarRequisicao({
  paymentId = "12345",
  secret = SECRET,
  tipo = "payment",
  idNaQuery = null,
} = {}) {
  const ts = "1700000000";
  const requestId = "req-abc";

  // A assinatura é calculada com o id da query quando ela existe — é o que a
  // documentação manda, e em minúsculas.
  const idAssinado = String(idNaQuery || paymentId).toLowerCase();
  const manifest = `id:${idAssinado};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

  const url = idNaQuery
    ? `https://exemplo.com/api/mp-webhook?data.id=${idNaQuery}&type=payment`
    : "https://exemplo.com/api/mp-webhook";

  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-signature": `ts=${ts},v1=${v1}`,
      "x-request-id": requestId,
    },
    body: JSON.stringify({ type: tipo, data: { id: paymentId } }),
  });
}

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------

let passou = 0;
let falhou = 0;

function verificar(nome, condicao, detalhe = "") {
  if (condicao) {
    console.log(`  OK   ${nome}`);
    passou += 1;
  } else {
    console.log(`  FALHA ${nome}${detalhe ? ` -> ${detalhe}` : ""}`);
    falhou += 1;
  }
}

console.log("\n1. Pagamento aprovado num pedido pendente");
resetarCenario();
{
  const res = await handler(montarRequisicao());
  const corpo = await res.json();
  verificar("responde 200", res.status === 200, `status ${res.status}`);
  verificar("marca o pedido como pago", banco["orders/user1/order1"].status === "paid");
  verificar("guarda o id do pagamento", banco["orders/user1/order1"].paymentId === "12345");
  verificar("baixa o estoque de 10 para 8", banco["products/prod1/stock"] === 8,
    `ficou ${banco["products/prod1/stock"]}`);
  verificar("informa a atualização", corpo.resultado === "pago", JSON.stringify(corpo));
  verificar("guarda o meio de pagamento",
    banco["orders/user1/order1"].paymentMethod === "bank_transfer");
  verificar("guarda a data do pagamento", Boolean(banco["orders/user1/order1"].paidAt));

  // O aviso precisa trazer o que você usa para separar e despachar.
  const aviso = avisosTelegram[0] || "";
  verificar("avisa no Telegram", avisosTelegram.length === 1, `${avisosTelegram.length} avisos`);
  verificar("aviso diz que o pagamento foi confirmado", aviso.includes("PAGAMENTO CONFIRMADO"));
  verificar("aviso traz o número do pedido", aviso.includes("202609081234"));
  verificar("aviso traz o meio de pagamento", aviso.includes("Pix"));
  verificar("aviso traz o item", aviso.includes("Batom"));
  verificar("aviso traz o endereço", aviso.includes("Rua A"));
}

console.log("\n2. Aviso repetido (o Mercado Pago reenvia) — não pode baixar estoque de novo");
resetarCenario({ statusDoPedido: "paid" });
{
  await handler(montarRequisicao());
  verificar("estoque continua 10", banco["products/prod1/stock"] === 10,
    `ficou ${banco["products/prod1/stock"]}`);
  const mexeuNoEstoque = escritas.some((e) => e.caminho.includes("stock"));
  verificar("nem tentou escrever no estoque", !mexeuNoEstoque);
  // Sem esta trava, cada reenvio do Mercado Pago mandaria um aviso novo.
  verificar("não avisa de novo no Telegram", avisosTelegram.length === 0,
    `${avisosTelegram.length} avisos`);
}

console.log("\n3. Assinatura errada, mas o pagamento existe e é nosso");
resetarCenario();
{
  // Foi o que derrubou a loja em produção: um detalhe no formato do texto
  // assinado. A assinatura não pode ser porteiro — a verdade é a consulta à
  // API, que só devolve pagamentos da nossa conta.
  const res = await handler(montarRequisicao({ secret: "segredo-errado" }));
  verificar("confirma mesmo assim", res.status === 200, `status ${res.status}`);
  verificar("marca como pago", banco["orders/user1/order1"].status === "paid");
  verificar("baixa o estoque", banco["products/prod1/stock"] === 8);
  // Funcionou, mas ela precisa saber que há algo a corrigir.
  const avisouDaAssinatura = avisosTelegram.some((a) => a.includes("MP_WEBHOOK_SECRET"));
  verificar("avisa que a assinatura não bateu", avisouDaAssinatura);
}

console.log("\n4. Aviso forjado: id que não existe na nossa conta");
resetarCenario();
pagamentoNaoEncontrado = true;
{
  const res = await handler(montarRequisicao({ paymentId: "99999" }));
  const corpo = await res.json();
  verificar("ignora sem confirmar nada", corpo.ignored === "payment_not_found",
    JSON.stringify(corpo));
  verificar("pedido continua pendente", banco["orders/user1/order1"].status === "pending");
  verificar("não tocou no estoque", banco["products/prod1/stock"] === 10);
  verificar("não avisa no Telegram", avisosTelegram.length === 0);
  pagamentoNaoEncontrado = false;
}

console.log("\n5. Pagou menos que o total do pedido");
resetarCenario({ valorPago: 1 });
{
  const res = await handler(montarRequisicao());
  verificar("responde 200 (não é erro do Mercado Pago)", res.status === 200);
  verificar("NÃO marca como pago", banco["orders/user1/order1"].status === "pending",
    `ficou ${banco["orders/user1/order1"].status}`);
  verificar("registra o alerta", Boolean(banco["orders/user1/order1"].paymentAlert));
  verificar("não baixa estoque", banco["products/prod1/stock"] === 10);
  // Não pode anunciar venda confirmada, mas PRECISA avisar do problema:
  // um pagamento a menor tem que chegar aos seus olhos antes do envio.
  const aviso = avisosTelegram[0] || "";
  verificar("não anuncia venda confirmada", !aviso.includes("PAGAMENTO CONFIRMADO"));
  verificar("avisa do valor divergente", aviso.includes("Confira no Mercado Pago"), aviso);
}

console.log("\n6. Aviso que não é de pagamento — deve ser ignorado");
resetarCenario();
{
  const res = await handler(montarRequisicao({ tipo: "plan" }));
  const corpo = await res.json();
  verificar("ignora sem erro", res.status === 200 && corpo.ignored === "plan",
    JSON.stringify(corpo));
  verificar("pedido intacto", banco["orders/user1/order1"].status === "pending");
}

console.log("\n7. Estoque menor que o pedido — registra alerta mas não vai a negativo");
resetarCenario();
banco["products/prod1/stock"] = 1;
{
  await handler(montarRequisicao());
  verificar("estoque para em 0", banco["products/prod1/stock"] === 0,
    `ficou ${banco["products/prod1/stock"]}`);
  verificar("avisa da divergência", Boolean(banco["orders/user1/order1"].stockAlert));
}

console.log("\n8. Id na query da URL, como o Mercado Pago realmente envia");
resetarCenario();
{
  // O id assinado é o da query. Se o código usar o do corpo, a assinatura
  // não fecha e isto falha — foi exatamente o bug que apareceu em produção.
  const res = await handler(montarRequisicao({ idNaQuery: "12345" }));
  verificar("aceita a assinatura", res.status === 200, `status ${res.status}`);
  verificar("marca como pago", banco["orders/user1/order1"].status === "paid");
}

console.log("\n9. Id alfanumérico em maiúsculas na query — deve ser assinado em minúsculas");
resetarCenario();
pagamento.id = "AbC123";
{
  const res = await handler(montarRequisicao({ paymentId: "AbC123", idNaQuery: "AbC123" }));
  verificar("aceita a assinatura", res.status === 200, `status ${res.status}`);
}

console.log("\n10. Estorno de um pedido pago — precisa devolver o estoque");
resetarCenario({ statusDoPedido: "paid" });
banco["products/prod1/stock"] = 8; // já tinha sido baixado na venda
pagamento.status = "refunded";
{
  const res = await handler(montarRequisicao());
  const corpo = await res.json();
  verificar("responde 200", res.status === 200);
  verificar("informa devolução", corpo.resultado === "devolvido", JSON.stringify(corpo));
  verificar("estoque volta de 8 para 10", banco["products/prod1/stock"] === 10,
    `ficou ${banco["products/prod1/stock"]}`);
  verificar("pedido sai de pago", banco["orders/user1/order1"].status === "pending");
  verificar("marca que o estoque voltou", banco["orders/user1/order1"].stockReturned === true);
  const aviso = avisosTelegram[0] || "";
  verificar("avisa do estorno", aviso.includes("ESTORNADO"), aviso.slice(0, 60));
}

console.log("\n11. Aviso de estorno repetido — não pode devolver duas vezes");
resetarCenario({ statusDoPedido: "paid" });
banco["products/prod1/stock"] = 10;
banco["orders/user1/order1"].stockReturned = true;
pagamento.status = "refunded";
{
  await handler(montarRequisicao());
  verificar("estoque continua 10", banco["products/prod1/stock"] === 10,
    `ficou ${banco["products/prod1/stock"]}`);
}

console.log("\n12. Contestação de cartão — devolve estoque e avisa com urgência");
resetarCenario({ statusDoPedido: "paid" });
banco["products/prod1/stock"] = 8;
pagamento.status = "charged_back";
{
  await handler(montarRequisicao());
  verificar("estoque devolvido", banco["products/prod1/stock"] === 10);
  const aviso = avisosTelegram[0] || "";
  verificar("avisa da contestação", aviso.includes("CONTESTAÇÃO"), aviso.slice(0, 60));
  verificar("explica o prazo", aviso.includes("prazo"));
}

console.log("\n13. Disputa aberta — avisa mas NÃO mexe em estoque nem status");
resetarCenario({ statusDoPedido: "paid" });
banco["products/prod1/stock"] = 8;
pagamento.status = "in_mediation";
{
  await handler(montarRequisicao());
  verificar("estoque intacto", banco["products/prod1/stock"] === 8,
    `ficou ${banco["products/prod1/stock"]}`);
  verificar("pedido continua pago", banco["orders/user1/order1"].status === "paid");
  verificar("avisa da disputa", (avisosTelegram[0] || "").includes("DISPUTA"));
}

console.log("\n14. Cartão recusado — registra sem encher seu Telegram");
resetarCenario();
pagamento.status = "rejected";
pagamento.status_detail = "cc_rejected_insufficient_amount";
{
  const res = await handler(montarRequisicao());
  const corpo = await res.json();
  verificar("informa recusa", corpo.resultado === "recusado", JSON.stringify(corpo));
  verificar("pedido continua pendente", banco["orders/user1/order1"].status === "pending");
  verificar("não baixa estoque", banco["products/prod1/stock"] === 10);
  // Cartão recusado é comum; avisar de cada tentativa vira ruído.
  verificar("NÃO avisa no Telegram", avisosTelegram.length === 0,
    `${avisosTelegram.length} avisos`);
  verificar("registra o motivo", Boolean(banco["orders/user1/order1"].paymentAlert));
}

console.log("\n15. Pix gerado e ainda não pago — só registra");
resetarCenario();
pagamento.status = "pending";
{
  const res = await handler(montarRequisicao());
  const corpo = await res.json();
  verificar("informa que aguarda", corpo.resultado === "aguardando", JSON.stringify(corpo));
  verificar("pedido continua pendente", banco["orders/user1/order1"].status === "pending");
  verificar("não baixa estoque", banco["products/prod1/stock"] === 10);
  verificar("não avisa no Telegram", avisosTelegram.length === 0);
}

console.log("\n16. Recusa e depois aprovação — o alerta antigo tem que sumir");
resetarCenario();
banco["orders/user1/order1"].paymentAlert = "Pagamento recusado (cc_rejected)";
pagamento.status = "approved";
{
  await handler(montarRequisicao());
  verificar("marca como pago", banco["orders/user1/order1"].status === "paid");
  verificar("limpa o alerta da recusa", !banco["orders/user1/order1"].paymentAlert,
    String(banco["orders/user1/order1"].paymentAlert));
}

console.log(`\n${passou} verificações passaram, ${falhou} falharam.\n`);
process.exit(falhou > 0 ? 1 : 0);
