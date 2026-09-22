// Núcleo da integração com o Mercado Pago.
//
// Tudo aqui roda no servidor porque o Access Token move dinheiro: com ele é
// possível consultar pagamentos, estornar e criar cobranças em nome da sua
// conta. Ele NUNCA pode aparecer no JavaScript da loja.
//
// Variáveis de ambiente necessárias:
//   MP_ACCESS_TOKEN     Access Token da sua conta (Suas integrações → Credenciais)
//   MP_WEBHOOK_SECRET   Assinatura secreta do webhook (mesma tela)
//   FIREBASE_DB_SECRET  Segredo do Realtime Database, para o webhook gravar
//
// O token de PRODUÇÃO começa com "APP_USR-". O de teste começa com "TEST-".

const API = "https://api.mercadopago.com";
const DB = "https://flow-fcfb6-default-rtdb.firebaseio.com";

export function getConfig() {
  const accessToken = process.env.MP_ACCESS_TOKEN || "";

  return {
    accessToken,
    webhookSecret: process.env.MP_WEBHOOK_SECRET || "",
    dbSecret: process.env.FIREBASE_DB_SECRET || "",
    // Credencial antiga de sandbox. O Mercado Pago migrou para "usuários de
    // teste", cujas credenciais começam com APP_USR- igual às de produção —
    // então NÃO é possível saber pelo token se é teste ou dinheiro real.
    // Quem descobre isso é isTestAccount(), abaixo, consultando a conta.
    isLegacySandbox: accessToken.startsWith("TEST-"),
    configured: Boolean(accessToken),
  };
}

// Descobre se o token pertence a um usuário de teste.
//
// Por que não dá para olhar só o token: a credencial de um usuário de teste
// começa com "APP_USR-", exatamente como a de produção. A diferença está na
// conta — o apelido de um usuário de teste é "TESTUSER...".
//
// Isso importa muito: sem essa checagem, você não tem como saber se está
// testando ou cobrando de verdade.
export async function isTestAccount() {
  const { ok, data } = await mpFetch("/users/me");
  if (!ok) return null; // indeterminado
  return String(data?.nickname || "").toUpperCase().startsWith("TESTUSER");
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// URL pública do site. O Netlify injeta URL automaticamente.
export function getSiteUrl(request) {
  const fromEnv = process.env.URL || process.env.DEPLOY_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:5173";
  }
}

export async function mpFetch(path, options = {}) {
  const { accessToken } = getConfig();

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------------------
// Acesso ao Firebase pelo servidor
// ---------------------------------------------------------------------------
//
// O webhook precisa marcar o pedido como pago, e as regras do banco só
// permitem isso à conta admin. Uma função não tem sessão de login, então
// usamos o segredo do banco na API REST.
//
// Esse segredo dá acesso TOTAL ao banco, ignorando as regras. Por isso ele
// vive só nas variáveis do Netlify e nunca sai daqui.

function dbUrl(path) {
  const { dbSecret } = getConfig();
  return `${DB}/${path}.json${dbSecret ? `?auth=${dbSecret}` : ""}`;
}

export async function readOrder(uid, orderId) {
  const res = await fetch(dbUrl(`orders/${uid}/${orderId}`));
  if (!res.ok) throw new Error(`Falha ao ler o pedido (${res.status})`);
  return res.json();
}

export async function patchOrder(uid, orderId, changes) {
  const res = await fetch(dbUrl(`orders/${uid}/${orderId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(`Falha ao atualizar o pedido (${res.status})`);
  return res.json();
}

// Baixa o estoque dos itens do pedido.
//
// LIMITAÇÃO: a API REST do Firebase não tem transação, então isto é um
// ler-calcular-gravar. Dois pagamentos confirmados no mesmo instante para o
// último item poderiam se atropelar. No volume de uma loja pequena o risco é
// baixo, e o painel mostra o estoque real para você conferir.
export async function decrementStock(items = []) {
  const problemas = [];

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    if (!item.id || quantity <= 0) continue;

    try {
      const res = await fetch(dbUrl(`products/${item.id}/stock`));
      const atual = await res.json();

      // null/ausente = produto sem controle de estoque. Não é problema.
      if (typeof atual !== "number") continue;

      const novo = Math.max(0, atual - quantity);
      if (atual < quantity) problemas.push(item.name || item.id);

      await fetch(dbUrl(`products/${item.id}/stock`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo),
      });
    } catch (err) {
      console.error(`Erro ao baixar estoque de ${item.name || item.id}:`, err);
      problemas.push(item.name || item.id);
    }
  }

  return problemas;
}
