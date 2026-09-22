// Diagnóstico do Mercado Pago, no mesmo formato do /api/melhorenvio/status.
//
// Existe porque descobrir "por que não funciona" às cegas custa horas. Aqui
// dá para ver, em uma requisição, se as variáveis chegaram, se o token é de
// teste ou de produção e se ele é aceito pela API deles.
//
// Nunca devolve credencial nenhuma — só o que é seguro saber.

import { getConfig, jsonResponse, mpFetch } from "./lib/mercadoPago.mjs";

export default async function handler() {
  const { configured, isTest, webhookSecret, dbSecret, accessToken } = getConfig();

  if (!configured) {
    return jsonResponse({
      configured: false,
      message: "MP_ACCESS_TOKEN não configurado no Netlify.",
    });
  }

  // Colar um valor longo no painel às vezes corta o fim, e o sintoma é
  // idêntico ao de um token inválido. Comparar o tamanho tira a dúvida.
  const base = {
    configured: true,
    environment: isTest ? "teste" : "produção",
    tokenLength: accessToken.length,
    webhookSecretSet: Boolean(webhookSecret),
    firebaseSecretSet: Boolean(dbSecret),
  };

  // Chamada leve só para confirmar que o token é aceito.
  const { ok, status, data } = await mpFetch("/users/me");

  if (!ok) {
    return jsonResponse({
      ...base,
      tokenValid: false,
      message:
        status === 401
          ? "O Mercado Pago recusou o token. Confira se copiou inteiro e do ambiente certo."
          : data?.message || `API respondeu ${status}.`,
    });
  }

  return jsonResponse({
    ...base,
    tokenValid: true,
    account: data?.nickname || data?.email || "",
    // Sem estes dois, o pagamento até acontece, mas o pedido nunca é
    // marcado como pago — o que é pior do que não funcionar.
    ready: Boolean(webhookSecret && dbSecret),
  });
}
