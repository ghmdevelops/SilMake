import { db } from "../firebase";
import { ref, push, set, update, remove, runTransaction } from "firebase/database";

// Cria um novo produto no Realtime Database
export function createProduct(product) {
  const productsRef = ref(db, "products");
  const newRef = push(productsRef);
  return set(newRef, {
    ...product,
    createdAt: Date.now(),
  });
}

// Atualiza um produto existente
export function updateProduct(id, product) {
  const productRef = ref(db, `products/${id}`);
  return update(productRef, product);
}

// Remove um produto
export function deleteProduct(id) {
  const productRef = ref(db, `products/${id}`);
  return remove(productRef);
}

// Dá baixa no estoque de um produto quando um pedido é finalizado.
// Usa transação para evitar que dois clientes comprem a última unidade ao
// mesmo tempo. Produtos sem controle de estoque (campo ausente/null) são
// ignorados. Retorna true se a baixa foi feita.
export async function decrementProductStock(productId, quantity) {
  const stockRef = ref(db, `products/${productId}/stock`);

  const result = await runTransaction(stockRef, (currentStock) => {
    // Produto sem controle de estoque: não mexe em nada.
    if (typeof currentStock !== "number") return undefined;
    // Estoque insuficiente: aborta a transação.
    if (currentStock < quantity) return;
    return currentStock - quantity;
  });

  return result.committed;
}

// Devolve unidades ao estoque — usado quando o admin encerra/cancela um
// pedido que já havia dado baixa. Produtos sem controle de estoque são
// ignorados. Só o admin consegue executar isso (regras do Firebase).
export async function incrementProductStock(productId, quantity) {
  const stockRef = ref(db, `products/${productId}/stock`);

  const result = await runTransaction(stockRef, (currentStock) => {
    if (typeof currentStock !== "number") return undefined;
    return currentStock + quantity;
  });

  return result.committed;
}

