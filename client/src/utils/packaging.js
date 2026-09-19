// Embalagem padrão da loja, pensada para cosméticos: uma caixinha que
// acomoda batom, creme ou perfume pequeno. Produtos cadastrados sem medidas
// usam estes valores na cotação, em vez de falharem ou de usarem um mínimo
// irreal que cobraria frete a menos.
export const DEFAULT_PACKAGE = {
  weight: 0.3, // kg
  length: 16, // cm
  width: 11, // cm
  height: 6, // cm
};

// Mínimos que os Correios aceitam. Abaixo disso a cotação é recusada, então
// as dimensões são sempre elevadas até aqui.
export const MIN_DIMENSIONS = {
  length: 16,
  width: 11,
  height: 2,
};

// Atalhos para o cadastro: um clique preenche os quatro campos com medidas
// típicas de cada tipo de produto de beleza.
export const PACKAGE_PRESETS = [
  {
    key: "pequeno",
    label: "Pequeno — batom, gloss, rímel",
    weight: 0.15,
    length: 16,
    width: 11,
    height: 3,
  },
  {
    key: "medio",
    label: "Médio — creme, sérum, perfume",
    weight: 0.35,
    length: 16,
    width: 11,
    height: 8,
  },
  {
    key: "grande",
    label: "Grande — kit, paleta, escova",
    weight: 0.8,
    length: 20,
    width: 15,
    height: 12,
  },
];

// Normaliza um item do carrinho para o formato da cotação. O peso real é
// enviado como está (a transportadora aplica o próprio mínimo de cobrança);
// as dimensões são elevadas ao mínimo aceito para a requisição não ser
// recusada.
export function toQuoteItem(item) {
  const weight = Number(item.weight) > 0 ? Number(item.weight) : DEFAULT_PACKAGE.weight;
  const length = Number(item.length) > 0 ? Number(item.length) : DEFAULT_PACKAGE.length;
  const width = Number(item.width) > 0 ? Number(item.width) : DEFAULT_PACKAGE.width;
  const height = Number(item.height) > 0 ? Number(item.height) : DEFAULT_PACKAGE.height;

  return {
    id: String(item.id),
    quantity: Math.max(1, Number(item.quantity) || 1),
    insurance_value: Number(item.price) || 0,
    weight,
    length: Math.max(MIN_DIMENSIONS.length, length),
    width: Math.max(MIN_DIMENSIONS.width, width),
    height: Math.max(MIN_DIMENSIONS.height, height),
  };
}

// Um produto só é considerado "medido" quando tem peso e as três dimensões.
export function hasPackageData(product) {
  return (
    Number(product?.weight) > 0 &&
    Number(product?.length) > 0 &&
    Number(product?.width) > 0 &&
    Number(product?.height) > 0
  );
}
