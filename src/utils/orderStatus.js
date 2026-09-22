// Prazo (em dias) que consideramos razoável para o cliente pagar antes do
// pedido ser sinalizado como atrasado / poder ser encerrado pelo admin.
export const PAYMENT_DEADLINE_DAYS = 4;
const PAYMENT_DEADLINE_MS = PAYMENT_DEADLINE_DAYS * 24 * 60 * 60 * 1000;

// Etapas possíveis do pedido, controladas manualmente pelo admin.
export const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "closed"];

export const ORDER_STATUS_LABELS = {
  pending: "Pendente",
  overdue: "Atrasado",
  paid: "Pago",
  shipped: "Enviado",
  completed: "Finalizado",
  closed: "Encerrado",
};

// Status em que as unidades do pedido estão FORA do estoque.
//
// A baixa acontece quando você confirma o pagamento, não quando o cliente
// finaliza o pedido. O motivo é de segurança: para o navegador do cliente
// dar baixa, a regra do Firebase precisava liberar escrita no estoque para
// qualquer pessoa logada — e isso permitia zerar o estoque da loja inteira
// criando uma conta.
export const STOCK_HELD_STATUSES = ["paid", "shipped", "completed"];

export function holdsStock(status) {
  return STOCK_HELD_STATUSES.includes(status);
}

// Normaliza o status salvo no pedido, com compatibilidade para pedidos
// antigos que ainda usam os campos booleanos "paid"/"closed" em vez do
// campo único "status".
function getBaseStatus(order) {
  if (order.status) return order.status;
  if (order.closed) return "closed";
  if (order.paid) return "paid";
  return "pending";
}

// Retorna true se o pedido ainda está pendente de pagamento e já passou do prazo.
export function isOrderOverdue(order) {
  const status = getBaseStatus(order);
  if (status !== "pending") return false;
  return Date.now() - (order.createdAt || 0) > PAYMENT_DEADLINE_MS;
}

// Calcula o status final a ser exibido na tela (inclui o estado "overdue",
// que é calculado na hora e não fica salvo no banco).
export function getOrderStatus(order) {
  const status = getBaseStatus(order);
  if (status === "pending" && isOrderOverdue(order)) return "overdue";
  return status;
}
