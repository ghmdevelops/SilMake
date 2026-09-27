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

// Situações do pagamento no Mercado Pago, traduzidas para quem lê.
//
// Importa mostrar isso para a cliente: um pedido "pendente" porque o Pix não
// foi pago e um pendente porque o cartão foi recusado pedem ações diferentes
// dela — e sem essa distinção ela só vê "pendente" e não sabe o que fazer.
const SITUACOES = {
  pending: { texto: "Aguardando pagamento", tom: "espera" },
  in_process: { texto: "Pagamento em análise", tom: "espera" },
  authorized: { texto: "Pagamento autorizado", tom: "espera" },
  approved: { texto: "Pagamento aprovado", tom: "ok" },
  rejected: { texto: "Pagamento recusado", tom: "ruim" },
  cancelled: { texto: "Pagamento cancelado", tom: "ruim" },
  refunded: { texto: "Pagamento estornado", tom: "ruim" },
  charged_back: { texto: "Pagamento contestado", tom: "ruim" },
  in_mediation: { texto: "Pagamento em disputa", tom: "ruim" },
};

export function paymentStatusInfo(status) {
  return SITUACOES[status] || null;
}
