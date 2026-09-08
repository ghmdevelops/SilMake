import { db } from "../firebase";
import { ref, push, set, update } from "firebase/database";

// Gera um número de pedido curto e fácil de falar/digitar (ex: "A3F92K"),
// só para referência entre cliente e loja — não precisa ser único no mundo,
// só o suficiente para não repetir na prática.
function generateOrderNumber() {
  return Date.now().toString(36).slice(-6).toUpperCase();
}

// Registra um pedido feito pelo cliente logado, para aparecer no histórico do
// perfil dele e no painel do admin. Todo pedido novo começa como "pending".
// Retorna o número do pedido gerado, para exibir na tela/mensagem de confirmação.
export async function createOrder(uid, order) {
  const ordersRef = ref(db, `orders/${uid}`);
  const newRef = push(ordersRef);
  const orderNumber = generateOrderNumber();

  await set(newRef, {
    ...order,
    orderNumber,
    status: "pending",
    createdAt: order.createdAt || Date.now(),
  });

  return orderNumber;
}

// Usado pelo admin para mudar a etapa do pedido:
// "pending" | "paid" | "shipped" | "completed" | "closed".
// Assim que salvo, atualiza automaticamente (em tempo real) a tela do cliente.
export function updateOrderPipelineStatus(uid, orderId, status) {
  const orderRef = ref(db, `orders/${uid}/${orderId}`);
  return update(orderRef, { status });
}

// Usado pelo admin para adicionar/atualizar o código de rastreio de um pedido.
// Assim que salvo, aparece automaticamente no histórico de pedidos do cliente.
export function updateOrderTracking(uid, orderId, trackingCode) {
  const orderRef = ref(db, `orders/${uid}/${orderId}`);
  return update(orderRef, { trackingCode });
}
