// Diz ao painel admin se a conta do Melhor Envio está conectada e até quando
// o acesso atual vale. Nunca devolve o token em si.

import { getConfig, readTokens, jsonResponse } from "./lib/melhorEnvio.mjs";

export default async function handler() {
  const { clientId, clientSecret, environment, directToken } = getConfig();

  // Token fixo do painel: já nasce conectado e sem prazo para acompanhar.
  if (directToken) {
    return jsonResponse({
      configured: true,
      connected: true,
      environment,
      mode: "token",
      expiresAt: null,
    });
  }

  const configured = !!clientId && !!clientSecret;

  if (!configured) {
    return jsonResponse({ configured: false, connected: false, environment });
  }

  const tokens = await readTokens();
  const connected = !!tokens?.access_token;

  return jsonResponse({
    configured: true,
    connected,
    environment,
    expiresAt: connected ? Number(tokens.expires_at) || null : null,
  });
}
