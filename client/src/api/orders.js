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
