// Passo 2 do OAuth: o Melhor Envio devolve o admin para cá com um código.
// Trocamos esse código pelo par de tokens e voltamos para o painel.

import {
  exchangeCodeForTokens,
  getRedirectUri,
  getSiteUrl,
  readTokens,
  writeTokens,
} from "./lib/melhorEnvio.mjs";

// Volta sempre para a aba Frete do admin, com o resultado na URL para a
// tela poder mostrar um aviso.
function backToAdmin(request, params) {
  const url = new URL(`${getSiteUrl(request)}/admin`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

export default async function handler(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return backToAdmin(request, { melhorenvio: "erro", motivo: error });
  }

  if (!code) {
    return backToAdmin(request, { melhorenvio: "erro", motivo: "sem_codigo" });
  }

  // Confere o state que geramos na etapa anterior.
  const stored = await readTokens();
  if (!stored?.oauth_state || stored.oauth_state !== state) {
    return backToAdmin(request, { melhorenvio: "erro", motivo: "state_invalido" });
  }

  try {
    await exchangeCodeForTokens(code, getRedirectUri(request));

    // O state é de uso único.
    const tokens = await readTokens();
    await writeTokens({ ...tokens, oauth_state: null, oauth_state_at: null });

    return backToAdmin(request, { melhorenvio: "conectado" });
  } catch (err) {
    console.error("Falha ao trocar o código por tokens:", err.message);
    return backToAdmin(request, { melhorenvio: "erro", motivo: "troca_falhou" });
  }
}
