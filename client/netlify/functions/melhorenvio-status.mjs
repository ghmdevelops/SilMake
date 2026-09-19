// Diz ao painel admin se a conta do Melhor Envio está conectada e até quando
// o acesso atual vale. Nunca devolve o token em si.

import { getConfig, readTokens, jsonResponse } from "./lib/melhorEnvio.mjs";

export default async function handler() {
  const { clientId, clientSecret, environment } = getConfig();
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
