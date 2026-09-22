import { db } from "../firebase";
import { ref, push, set, update } from "firebase/database";

// Gera um número de pedido com 12 dígitos numéricos (ex: "202609081234"),
// fácil de buscar tanto pelo cliente quanto direto no banco de dados.
// Não precisa ser único no mundo, só o suficiente para não repetir na prática.
function generateOrderNumber() {
  const timePart = Date.now().toString().slice(-8); // 8 últimos dígitos do horário
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos aleatórios
  return timePart + randomPart;
}

// Registra um pedido feito pelo cliente logado, para aparecer no histórico do
// perfil dele e no painel do admin. Todo pedido novo começa como "pending".
//
// Devolve os dois identificadores:
//   orderNumber — o número amigável, mostrado ao cliente
//   orderId     — a chave do Firebase, usada pelo pagamento para saber qual
//                 pedido cobrar e qual marcar como pago
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

  return { orderNumber, orderId: newRef.key };
}

// Vendas fechadas fora do site (WhatsApp, Instagram, presencial) lançadas
// pelo admin. Ficam sob "orders/manual" por não pertencerem a nenhuma conta
// de cliente — aparecem no painel e nas métricas como qualquer outro pedido.
export const MANUAL_ORDERS_UID = "manual";

export async function createManualOrder(order) {
  const ordersRef = ref(db, `orders/${MANUAL_ORDERS_UID}`);
  const newRef = push(ordersRef);
  const orderNumber = generateOrderNumber();

  await set(newRef, {
    ...order,
    orderNumber,
    manual: true,
    status: order.status || "paid",
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

// Usado pelo admin para adicionar/atualizar o código e o link de rastreio de
// um pedido. Assim que salvo, aparece automaticamente no histórico de pedidos
// do cliente (o link é opcional).
export function updateOrderTracking(uid, orderId, trackingCode, trackingUrl = "") {
  const orderRef = ref(db, `orders/${uid}/${orderId}`);
  return update(orderRef, { trackingCode, trackingUrl });
}
