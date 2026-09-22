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

let banco;
let pagamento;
let escritas;

function resetarCenario({ statusDoPedido = "pending", valorPago = 100 } = {}) {
  escritas = [];
  banco = {
    "orders/user1/order1": {
      orderNumber: "202609081234",
      status: statusDoPedido,
      total: 100,
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
    payment_type_id: "pix",
    date_approved: "2026-09-22T10:00:00.000Z",
  };
}

globalThis.fetch = async (url, options = {}) => {
  const endereco = String(url);
  const metodo = options.method || "GET";

  // --- Mercado Pago ---
  if (endereco.includes("api.mercadopago.com")) {
    if (endereco.includes("/v1/payments/")) {
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

function montarRequisicao({ paymentId = "12345", secret = SECRET, tipo = "payment" } = {}) {
  const ts = "1700000000";
  const requestId = "req-abc";
  // Formato exigido pelo Mercado Pago.
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

  return new Request("https://exemplo.com/api/mp-webhook", {
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
  verificar("informa a atualização", corpo.updated === "paid", JSON.stringify(corpo));
}

console.log("\n2. Aviso repetido (o Mercado Pago reenvia) — não pode baixar estoque de novo");
resetarCenario({ statusDoPedido: "paid" });
{
  await handler(montarRequisicao());
  verificar("estoque continua 10", banco["products/prod1/stock"] === 10,
    `ficou ${banco["products/prod1/stock"]}`);
  const mexeuNoEstoque = escritas.some((e) => e.caminho.includes("stock"));
  verificar("nem tentou escrever no estoque", !mexeuNoEstoque);
}

console.log("\n3. Assinatura forjada — alguém tentando marcar pedido como pago");
resetarCenario();
{
  const res = await handler(montarRequisicao({ secret: "segredo-errado" }));
  verificar("recusa com 401", res.status === 401, `status ${res.status}`);
  verificar("pedido continua pendente", banco["orders/user1/order1"].status === "pending");
  verificar("não tocou no estoque", banco["products/prod1/stock"] === 10);
}

console.log("\n4. Sem segredo configurado — precisa falhar fechado");
resetarCenario();
{
  const guardado = process.env.MP_WEBHOOK_SECRET;
  process.env.MP_WEBHOOK_SECRET = "";
  const res = await handler(montarRequisicao());
  verificar("recusa em vez de confiar", res.status === 401, `status ${res.status}`);
  verificar("pedido continua pendente", banco["orders/user1/order1"].status === "pending");
  process.env.MP_WEBHOOK_SECRET = guardado;
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

console.log(`\n${passou} verificações passaram, ${falhou} falharam.\n`);
process.exit(falhou > 0 ? 1 : 0);
