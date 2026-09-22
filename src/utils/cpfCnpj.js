// CPF e CNPJ: máscara e validação real pelos dígitos verificadores.
//
// Validar de verdade importa aqui porque esse número vai para a etiqueta de
// envio. Um CPF digitado errado só aparece na hora de despachar, quando a
// transportadora recusa — com o pedido já pago e o cliente esperando.

export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

// Aplica a máscara conforme o tamanho: até 11 dígitos formata como CPF,
// acima disso como CNPJ. Assim o mesmo campo atende pessoa física e loja.
export function formatCpfCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

// Calcula um dígito verificador pela soma ponderada usada nos dois documentos.
function checkDigit(digits, weights) {
  const sum = weights.reduce((acc, weight, i) => acc + Number(digits[i]) * weight, 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(value) {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  // Sequências repetidas (111.111.111-11) passam na conta dos dígitos, mas
  // não são CPFs válidos.
  if (/^(\d)\1{10}$/.test(d)) return false;

  const d1 = checkDigit(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = checkDigit(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

export function isValidCnpj(value) {
  const d = onlyDigits(value);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const d1 = checkDigit(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = checkDigit(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

// Vazio é considerado válido: o campo é opcional. Quem não quiser informar
// não deve ser impedido de salvar o resto do perfil.
export function isValidCpfCnpj(value) {
  const d = onlyDigits(value);
  if (d.length === 0) return true;
  if (d.length === 11) return isValidCpf(d);
  if (d.length === 14) return isValidCnpj(d);
  return false;
}
