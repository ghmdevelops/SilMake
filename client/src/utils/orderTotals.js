// As regras do Firebase conseguem validar o preço de cada item contra o
// catálogo, mas não sabem somar uma lista — então o campo "total" do pedido
// é o único que ainda pode chegar divergente. Aqui recalculamos o valor
// esperado para que o painel admin destaque qualquer diferença.
export function getExpectedTotal(order) {
  const itemsTotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  return itemsTotal + Number(order.shippingFee || 0);
}

// Tolerância de 1 centavo para não acusar diferença por arredondamento.
export function hasTotalMismatch(order) {
  return Math.abs(getExpectedTotal(order) - Number(order.total || 0)) > 0.01;
}

