import { db } from "../firebase";
import { ref, push, set } from "firebase/database";

// Registra um pedido feito pelo cliente logado, para aparecer no histórico do perfil.
export function createOrder(uid, order) {
  const ordersRef = ref(db, `orders/${uid}`);
  const newRef = push(ordersRef);
  return set(newRef, {
    ...order,
    createdAt: Date.now(),
  });
}
