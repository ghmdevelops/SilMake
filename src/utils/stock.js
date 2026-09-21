// Quando o estoque estiver igual ou abaixo deste número, mostramos um aviso
// de "últimas unidades" para o cliente.
export const LOW_STOCK_THRESHOLD = 5;

// Produtos sem o campo "stock" definido são tratados como sem controle de
// estoque (sempre disponíveis), para não afetar produtos antigos.
export function hasStockControl(product) {
  return typeof product.stock === "number";
}

export function isOutOfStock(product) {
  return hasStockControl(product) && product.stock <= 0;
}

export function isLowStock(product) {
  return hasStockControl(product) && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
}
