// Aviso de novo pedido no seu Telegram.
//
// Usado quando NÃO há pagamento online no fluxo — aí o pedido em si é o que
// interessa avisar. Quando o cliente vai pagar pelo Mercado Pago, quem avisa
// é o webhook, e só depois do pagamento aprovado (veja mp-webhook.mjs).
//
// Por que isso é uma função no servidor: o token do bot dá controle total
// sobre ele. Antes este código rodava no navegador, o que significa que o
// token ia dentro do JavaScript da loja, legível por qualquer visitante.
//
// Mudar para variável de ambiente com prefixo VITE_ NÃO resolveria: o Vite
// embute o valor no arquivo final do mesmo jeito.

import { sendTelegram, MAX_LENGTH } from "./lib/telegram.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const text = String(body?.text || "").trim();

  if (!text) return jsonResponse({ error: "empty_text" }, 400);
  // Limite protege contra alguém usar este endereço para despejar texto no
  // seu Telegram.
  if (text.length > MAX_LENGTH) return jsonResponse({ error: "too_long" }, 413);

  const resultado = await sendTelegram(text);

  if (!resultado.sent) {
    const status = resultado.reason === "not_configured" ? 503 : 502;
    return jsonResponse({ error: resultado.reason }, status);
  }

  return jsonResponse({ sent: true });
}
