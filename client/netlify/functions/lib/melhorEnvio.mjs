// Núcleo da integração com o Melhor Envio.
//
// A autenticação deles é OAuth2: em vez de uma chave fixa, você autoriza o
// aplicativo uma vez e recebe um par de tokens que EXPIRA em 30 dias e é
// trocado por um novo a cada renovação. Por isso os tokens não podem viver
// numa variável de ambiente (que é fixa) — eles precisam ser gravados.
//
// Variáveis de ambiente necessárias:
//   MELHOR_ENVIO_CLIENT_ID      id do aplicativo (painel → Integrações → Área Dev)
//   MELHOR_ENVIO_CLIENT_SECRET  segredo do aplicativo
//   MELHOR_ENVIO_ENV            "sandbox" ou "production"
//   MELHOR_ENVIO_USER_AGENT     "SilBeauty (seu-email@exemplo.com)"

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const BASE_URLS = {
  sandbox: "https://sandbox.melhorenvio.com.br",
  production: "https://melhorenvio.com.br",
};

// Só pedimos a permissão de cotar — nada de ler etiquetas ou movimentar
// dinheiro na conta.
export const OAUTH_SCOPE = "shipping-calculate";

// Renovamos com folga para nunca cair no limite exato da expiração.
const RENEW_BEFORE_MS = 3 * 24 * 60 * 60 * 1000; // 3 dias

// Arquivo usado só em desenvolvimento local (no Netlify usamos Blobs).
const LOCAL_STORE_PATH = resolve(process.cwd(), ".netlify", "melhor-envio-tokens.json");

export function getConfig() {
  const environment = process.env.MELHOR_ENVIO_ENV === "production" ? "production" : "sandbox";
  return {
    clientId: process.env.MELHOR_ENVIO_CLIENT_ID || "",
    clientSecret: process.env.MELHOR_ENVIO_CLIENT_SECRET || "",
    environment,
    baseUrl: BASE_URLS[environment],
    userAgent: process.env.MELHOR_ENVIO_USER_AGENT || "SilBeauty (contato@silbeauty.com)",
  };
}

// URL pública do site, usada para montar o endereço de callback. O Netlify
// injeta URL/DEPLOY_URL automaticamente.
export function getSiteUrl(request) {
  const fromEnv = process.env.URL || process.env.DEPLOY_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:5173";
  }
}

export function getRedirectUri(request) {
  return `${getSiteUrl(request)}/api/melhorenvio/callback`;
}

// ---------------------------------------------------------------------------
// Guarda dos tokens
// ---------------------------------------------------------------------------

async function getBlobStore() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: "melhor-envio", consistency: "strong" });
  } catch {
    // Fora do Netlify (ex: `npm run dev`) não há Blobs — usamos arquivo.
    return null;
  }
}

export async function readTokens() {
  const store = await getBlobStore();

  if (store) {
    try {
      return await store.get("tokens", { type: "json" });
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(await readFile(LOCAL_STORE_PATH, "utf8"));
  } catch {
    return null;
  }
}

export async function writeTokens(tokens) {
  const store = await getBlobStore();

  if (store) {
    await store.setJSON("tokens", tokens);
    return;
  }

  await mkdir(dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(tokens, null, 2), "utf8");
}

export async function clearTokens() {
  await writeTokens(null);
}

// ---------------------------------------------------------------------------
// Fluxo OAuth
// ---------------------------------------------------------------------------

function saveResponseTokens(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    // expires_in vem em segundos; guardamos o instante absoluto.
    expires_at: Date.now() + (Number(data.expires_in) || 0) * 1000,
    updated_at: Date.now(),
  };
}

async function requestToken(body) {
  const { baseUrl, userAgent } = getConfig();

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw new Error(data.message || data.error || `Falha na autenticação (${response.status})`);
  }

  const tokens = saveResponseTokens(data);
  await writeTokens(tokens);
  return tokens;
}

// Primeira autorização: troca o código recebido no callback pelos tokens.
export function exchangeCodeForTokens(code, redirectUri) {
  const { clientId, clientSecret } = getConfig();
  return requestToken({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });
}

// Renovação: o Melhor Envio devolve um NOVO refresh_token a cada uso, por
// isso é obrigatório regravar o par inteiro.
export function refreshTokens(refreshToken) {
  const { clientId, clientSecret } = getConfig();
  return requestToken({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
}

// Token pronto para uso: renova sozinho quando está perto de vencer.
// `force` é usado quando a API responde 401 mesmo com token aparentemente válido.
export async function getValidAccessToken({ force = false } = {}) {
  const tokens = await readTokens();
  if (!tokens?.access_token) return null;

  const expiringSoon = Date.now() > Number(tokens.expires_at || 0) - RENEW_BEFORE_MS;

  if ((force || expiringSoon) && tokens.refresh_token) {
    try {
      const renewed = await refreshTokens(tokens.refresh_token);
      return renewed.access_token;
    } catch (err) {
      console.error("Não foi possível renovar o token do Melhor Envio:", err.message);
      // Se a renovação falhou mas o token atual ainda não venceu, seguimos
      // com ele — melhor cotar do que derrubar a loja.
      return expiringSoon && Date.now() > Number(tokens.expires_at || 0)
        ? null
        : tokens.access_token;
    }
  }

  return tokens.access_token;
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
