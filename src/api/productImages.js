import { db } from "../firebase";
import { ref, get, set, remove } from "firebase/database";

// Fotos EXTRAS do produto (a 2ª e a 3ª). Ficam num nó separado de propósito.
//
// A vitrine escuta o nó "products" inteiro, então tudo que mora lá é baixado
// por todo visitante, de todos os produtos, sempre. Fotos enviadas por upload
// são guardadas em base64 e pesam ~150 KB cada — colocá-las junto do produto
// faria o cliente baixar as fotos 2 e 3 de itens que ele nem abriu.
//
// Aqui elas são lidas sob demanda, só quando alguém abre aquele produto.
// A foto principal continua em products/<id>/image, porque essa sim aparece
// na vitrine, no carrinho e nos pedidos.

export const MAX_PRODUCT_IMAGES = 3;

// Lê as fotos extras de um produto. Devolve [] quando não há nenhuma —
// nunca lança, para uma falha de leitura não derrubar a página do produto.
export async function fetchExtraImages(productId) {
  if (!productId) return [];

  try {
    const snapshot = await get(ref(db, `productImages/${productId}`));
    const value = snapshot.val();
    if (!value) return [];
    // O Firebase devolve objeto quando os índices têm buracos.
    return (Array.isArray(value) ? value : Object.values(value)).filter(Boolean);
  } catch (err) {
    console.error("Não foi possível carregar as fotos extras:", err);
    return [];
  }
}

// Grava as fotos extras. Lista vazia remove o nó, para não deixar lixo.
export function saveExtraImages(productId, images) {
  const node = ref(db, `productImages/${productId}`);
  const clean = (images || []).filter(Boolean).slice(0, MAX_PRODUCT_IMAGES - 1);
  return clean.length > 0 ? set(node, clean) : remove(node);
}

// Chamado junto da exclusão do produto: sem isso as fotos ficariam órfãs,
// ocupando espaço no banco para sempre.
export function deleteExtraImages(productId) {
  return remove(ref(db, `productImages/${productId}`));
}
