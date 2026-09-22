// Nomes que o Mercado Pago usa para o meio de pagamento, traduzidos para o
// que aparece na tela. Fica aqui porque o painel e o histórico do cliente
// mostram a mesma informação.
// Atenção: Pix chega como "bank_transfer". O texto "pix" vem em outro campo
// da API (payment_method_id), por isso ele também está mapeado.
const MEIOS = {
  credit_card: "cartão de crédito",
  debit_card: "cartão de débito",
  ticket: "boleto",
  bank_transfer: "Pix",
  pix: "Pix",
  account_money: "saldo Mercado Pago",
  digital_wallet: "carteira digital",
  digital_currency: "moeda digital",
  voucher_card: "vale",
  prepaid_card: "cartão pré-pago",
};

export function paymentMethodLabel(paymentType) {
  return MEIOS[paymentType] || paymentType || "meio não informado";
}
