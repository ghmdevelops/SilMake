import { db } from "../firebase";
import { ref, update, increment } from "firebase/database";

// Contadores próprios da loja, guardados no Firebase em `stats/`.
//
// Por que não depender só do Google Analytics: o dado que mais importa para
// uma loja pequena é "quanta gente viu este produto e quantas compraram".
// Guardando aqui, esse número aparece no seu painel junto das vendas, sem
// você precisar abrir outra ferramenta.
//
// Usamos `increment()` do Firebase: a soma acontece no servidor, de forma
// atômica. Isso permite que a regra do banco libere apenas "somar 1" sem dar
// permissão de leitura dos contadores para o público.

// Evita contar a mesma visita várias vezes (recarregar a página, voltar ao
// produto). O registro dura só a aba aberta.
function alreadyCounted(key) {
  try {
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, "1");
    return false;
  } catch {
    // Navegador sem sessionStorage: conta normalmente.
    return false;
  }
}

function bump(path) {
  // Silencioso de propósito: medição nunca deve quebrar a loja nem poluir o
  // console do cliente se as regras não estiverem publicadas.
  return update(ref(db), { [path]: increment(1) }).catch(() => {});
}

export function trackProductView(productId) {
  if (!productId) return;
  if (alreadyCounted(`view:${productId}`)) return;
  bump(`stats/productViews/${productId}`);
}

export function trackAddToCart(productId) {
  if (!productId) return;
  bump(`stats/addToCart/${productId}`);
}

// Termos buscados sem resultado: mostra o que os clientes procuram e você
// não tem. É uma das informações mais acionáveis de uma loja.
export function trackEmptySearch(term) {
  const clean = (term || "").trim().toLowerCase().slice(0, 40);
  // Chaves do Firebase não aceitam estes caracteres.
  if (clean.length < 3 || /[.#$/[\]]/.test(clean)) return;
  if (alreadyCounted(`search:${clean}`)) return;
  bump(`stats/emptySearches/${clean}`);
}
