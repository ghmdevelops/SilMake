// Envio de mensagens para o Telegram do admin.
//
// Fica separado porque dois lugares avisam: a função notify-order (pedidos
// sem pagamento online) e o webhook do Mercado Pago (quando o pagamento é
// aprovado). Duplicar o envio em dois arquivos faria a próxima correção
// precisar ser feita duas vezes.

export const MAX_LENGTH = 3000;

// Nunca lança. Um aviso que falha não pode derrubar quem chamou — no caso do
// webhook, isso faria o Mercado Pago reenviar o aviso e o pedido ser
// processado de novo.
export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram não configurado. Aviso não enviado.");
    return { sent: false, reason: "not_configured" };
  }

  const corpo = String(text || "").trim();
  if (!corpo) return { sent: false, reason: "empty" };
  if (corpo.length > MAX_LENGTH) return { sent: false, reason: "too_long" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: corpo }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Telegram recusou o envio:", res.status, data?.description);
      return { sent: false, reason: "telegram_error", status: res.status };
    }

    return { sent: true };
  } catch (err) {
    console.error("Não foi possível falar com o Telegram:", err);
    return { sent: false, reason: "network" };
  }
}

// Nomes que o Mercado Pago usa em payment_type_id, traduzidos para o que
// você lê na mensagem.
//
// Atenção: Pix chega como "bank_transfer" aqui. O texto "pix" vem em outro
// campo (payment_method_id), por isso ele também está mapeado abaixo — se um
// dia a API mudar, a mensagem continua legível.
const MEIOS = {
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  ticket: "Boleto",
  bank_transfer: "Pix",
  pix: "Pix",
  account_money: "Saldo Mercado Pago",
  digital_wallet: "Carteira digital",
  digital_currency: "Moeda digital",
  voucher_card: "Vale",
  prepaid_card: "Cartão pré-pago",
};

export function nomeDoMeio(paymentTypeId) {
  return MEIOS[paymentTypeId] || paymentTypeId || "Não informado";
}

export function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarDataHora(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
