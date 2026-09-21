import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "silbeauty_recently_viewed";
const MAX_ITEMS = 8;

// Guarda só os IDs, nunca os dados do produto. Assim o nome, o preço e a foto
// vêm sempre do catálogo atual — diferente do carrinho e dos favoritos, que
// salvam o objeto e por isso precisam ser reconciliados depois.
function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

// Avisa as outras instâncias do hook na MESMA aba. O evento "storage" do
// navegador só dispara em abas diferentes, então sem isto a vitrine não
// atualizaria ao voltar da página do produto.
const listeners = new Set();

function publish(ids) {
  listeners.forEach((fn) => fn(ids));
}

export function useRecentlyViewed(currentId) {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    listeners.add(setIds);
    return () => {
      listeners.delete(setIds);
    };
  }, []);

  const remember = useCallback((id) => {
    if (!id) return;
    // Revisitar um produto o traz para a frente em vez de duplicar.
    const next = [id, ...read().filter((saved) => saved !== id)].slice(0, MAX_ITEMS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Modo privado ou armazenamento cheio: a loja segue funcionando.
    }
    publish(next);
  }, []);

  // Na página de um produto, ele mesmo não deve aparecer na lista.
  return { ids: currentId ? ids.filter((id) => id !== currentId) : ids, remember };
}
