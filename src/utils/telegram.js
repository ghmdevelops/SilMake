// Avisa você no Telegram quando um pedido é finalizado.
//
// O envio acontece numa função no servidor (netlify/functions/notify-order.mjs),
// não aqui. O motivo é o token do bot: se ele ficasse no código do site,
// qualquer visitante poderia lê-lo e usar o seu bot. Este arquivo só repassa
// o texto.
const NOTIFY_URL = "/api/notify-order";

// Nunca lança: uma falha no aviso não pode derrubar o checkout. O pedido já
// está salvo no Firebase e aparece no painel de qualquer forma — o Telegram é
// conveniência, não a fonte da verdade.
export async function sendTelegramNotification(text) {
  try {
    const res = await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (res.ok) return true;

    // 404 = rodando sem as funções; 503 = variáveis não configuradas.
    const data = await res.json().catch(() => ({}));
    console.warn(
      `Aviso de pedido não enviado (${res.status}${data.error ? ` ${data.error}` : ""}).`
    );
    return false;
  } catch (err) {
    console.warn("Aviso de pedido não enviado:", err.message);
    return false;
  }
}
