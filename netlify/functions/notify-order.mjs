// Envia o aviso de novo pedido para o seu Telegram.
//
// Por que isso é uma função no servidor: o token do bot dá controle total
// sobre ele — quem tiver o token manda mensagem no seu lugar, lê as conversas
// e pode até desligar o bot. Antes este código rodava no navegador, o que
// significa que o token ia dentro do JavaScript da loja, legível por qualquer
// visitante.
//
// Mudar para variável de ambiente com prefixo VITE_ NÃO resolveria: o Vite
// embute o valor no arquivo final do mesmo jeito. Só sai do alcance do
// visitante rodando aqui.
//
// Variáveis necessárias (painel do Netlify):
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_CHAT_ID

// Mensagem de pedido tem umas 20 linhas. O limite protege contra alguém
// usar este endereço para despejar texto no seu Telegram.
const MAX_LENGTH = 3000;

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

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return jsonResponse(
      {
        error: "not_configured",
        message: "TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID não estão configurados.",
      },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const text = String(body?.text || "").trim();

  if (!text) {
    return jsonResponse({ error: "empty_text" }, 400);
  }
  if (text.length > MAX_LENGTH) {
    return jsonResponse({ error: "too_long" }, 413);
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Telegram respondeu com erro:", res.status, data);
      return jsonResponse(
        { error: "telegram_failed", message: data?.description || "Falha no envio." },
        502
      );
    }

    return jsonResponse({ sent: true });
  } catch (err) {
    console.error("Não foi possível falar com o Telegram:", err);
    return jsonResponse({ error: "network" }, 502);
  }
}
