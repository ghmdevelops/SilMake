// Passo 1 do OAuth: manda o admin para a tela de autorização do Melhor Envio.
//
// O "state" é um valor aleatório que guardamos aqui e conferimos na volta.
// Serve para garantir que a resposta veio do fluxo que nós iniciamos, e não
// de um link forjado por outra pessoa (proteção contra CSRF).

import {
  getConfig,
  getRedirectUri,
  readTokens,
  writeTokens,
  jsonResponse,
  OAUTH_SCOPE,
} from "./lib/melhorEnvio.mjs";

export default async function handler(request) {
  const { clientId, baseUrl } = getConfig();

  if (!clientId) {
    return jsonResponse(
      {
        error: "not_configured",
        message:
          "Falta configurar MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET nas variáveis de ambiente.",
      },
      503
    );
  }

  const state = crypto.randomUUID();
  const existing = (await readTokens()) || {};
  await writeTokens({ ...existing, oauth_state: state, oauth_state_at: Date.now() });

  const redirectUri = getRedirectUri(request);
  const authorizeUrl = new URL(`${baseUrl}/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", OAUTH_SCOPE);
  authorizeUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: { Location: authorizeUrl.toString() },
  });
}
