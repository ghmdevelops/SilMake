// Google Analytics 4 — opcional e condicionado ao consentimento.
//
// Decisões por trás deste arquivo:
//
// 1. O script do Google é carregado sob demanda, direto do CDN deles, e só
//    depois do cliente aceitar os cookies. Antes disso, nada é carregado e
//    nenhuma requisição sai do navegador — o banner passa a valer de verdade.
// 2. Fica fora do nosso bundle: não pesa no carregamento de quem recusar.
// 3. Se a medição não estiver configurada, todas as funções viram no-op.
//
// Para ativar, coloque o ID de medição no client/.env:
//     VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
// (obtido no Google Analytics, ou no Firebase Console ao habilitar o
// Google Analytics no projeto).

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";
const CONSENT_KEY = "silbeauty_cookie_consent";

let loaded = false;

export function isAnalyticsConfigured() {
  return !!MEASUREMENT_ID;
}

export function hasConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function gtag(...args) {
  if (!window.dataLayer) return;
  window.dataLayer.push(args);
}

// Injeta o script do GA. Chamado no primeiro carregamento (se já havia
// consentimento) ou no momento em que o cliente clica em "Aceitar".
export function initAnalytics() {
  if (loaded || !MEASUREMENT_ID || !hasConsent()) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  gtag("js", new Date());
  // anonymize_ip reduz o dado pessoal coletado, alinhado à LGPD.
  gtag("config", MEASUREMENT_ID, { anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// Remove o que o GA gravou e recarrega, para o "Recusar" ter efeito real
// mesmo se a medição já estava ativa numa visita anterior.
export function disableAnalytics() {
  if (!MEASUREMENT_ID) return;

  window[`ga-disable-${MEASUREMENT_ID}`] = true;

  try {
    document.cookie
      .split(";")
      .map((c) => c.split("=")[0].trim())
      .filter((name) => name.startsWith("_ga") || name === "_gid")
      .forEach((name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
  } catch {
    // Sem acesso a cookies: nada a limpar.
  }
}

export function trackPageView(path) {
  if (!loaded) return;
  gtag("event", "page_view", { page_path: path });
}

// Eventos de e-commerce no padrão que o GA4 entende, para os relatórios de
// loja funcionarem sem configuração extra.
export function trackEvent(name, params = {}) {
  if (!loaded) return;
  gtag("event", name, params);
}
