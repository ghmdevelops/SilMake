// O produto pode ter um "preço antigo" (oldPrice) cadastrado no admin.
// Quando ele existe e é maior que o preço de venda, a loja mostra o valor
// riscado e o selo de desconto. `price` continua sendo sempre o valor cobrado.
export function getDiscount(product) {
  const price = Number(product?.price || 0);
  const oldPrice = Number(product?.oldPrice || 0);

  if (!oldPrice || oldPrice <= price) return null;

  return {
    oldPrice,
    percent: Math.round(((oldPrice - price) / oldPrice) * 100),
    saved: oldPrice - price,
  };
}
