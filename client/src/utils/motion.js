// Se a pessoa pediu menos movimento nas configurações do sistema, respeitamos
// isso também no que o CSS não alcança — como o avanço automático do
// carrossel, que é controlado por JavaScript.
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
