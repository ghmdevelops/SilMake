// Permite reabrir o aviso de cookies de qualquer lugar do site (usado no
// rodapé). O consentimento precisa ser revogável: quem aceitou tem que poder
// mudar de ideia depois, e não havia como fazer isso.
//
// Fica num arquivo próprio (e não dentro do componente) para o componente
// continuar exportando apenas o componente — requisito do Fast Refresh.
export const COOKIE_PREFERENCES_EVENT = "silbeauty:cookie-preferences";

export function openCookiePreferences() {
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT));
}
