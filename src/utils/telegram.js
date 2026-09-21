import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "../config";

// Envia uma mensagem para o Telegram do admin, sem nenhuma interação visível
// do lado do cliente (nada abre, nada redireciona). Veja o README para
// configurar o bot (TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID em config.js).
export async function sendTelegramNotification(text) {
  if (
    !TELEGRAM_BOT_TOKEN ||
    !TELEGRAM_CHAT_ID ||
    TELEGRAM_BOT_TOKEN.startsWith("COLOQUE_") ||
    TELEGRAM_CHAT_ID.startsWith("COLOQUE_")
  ) {
    console.warn(
      "Telegram não configurado (veja TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID em src/config.js). Notificação não enviada."
    );
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.description || "Falha ao enviar notificação pelo Telegram");
  }

  return true;
}
