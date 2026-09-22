import { onlyDigits } from "./cpfCnpj";

// Todos os DDDs em uso no Brasil, com o estado ao lado. A lista existe para
// virar um seletor: escolhendo da lista, é impossível digitar um DDD que não
// existe — o erro mais comum em cadastro de telefone.
export const DDDS = [
  { ddd: "11", uf: "SP" }, { ddd: "12", uf: "SP" }, { ddd: "13", uf: "SP" },
  { ddd: "14", uf: "SP" }, { ddd: "15", uf: "SP" }, { ddd: "16", uf: "SP" },
  { ddd: "17", uf: "SP" }, { ddd: "18", uf: "SP" }, { ddd: "19", uf: "SP" },
  { ddd: "21", uf: "RJ" }, { ddd: "22", uf: "RJ" }, { ddd: "24", uf: "RJ" },
  { ddd: "27", uf: "ES" }, { ddd: "28", uf: "ES" },
  { ddd: "31", uf: "MG" }, { ddd: "32", uf: "MG" }, { ddd: "33", uf: "MG" },
  { ddd: "34", uf: "MG" }, { ddd: "35", uf: "MG" }, { ddd: "37", uf: "MG" },
  { ddd: "38", uf: "MG" },
  { ddd: "41", uf: "PR" }, { ddd: "42", uf: "PR" }, { ddd: "43", uf: "PR" },
  { ddd: "44", uf: "PR" }, { ddd: "45", uf: "PR" }, { ddd: "46", uf: "PR" },
  { ddd: "47", uf: "SC" }, { ddd: "48", uf: "SC" }, { ddd: "49", uf: "SC" },
  { ddd: "51", uf: "RS" }, { ddd: "53", uf: "RS" }, { ddd: "54", uf: "RS" },
  { ddd: "55", uf: "RS" },
  { ddd: "61", uf: "DF" },
  { ddd: "62", uf: "GO" }, { ddd: "64", uf: "GO" },
  { ddd: "63", uf: "TO" },
  { ddd: "65", uf: "MT" }, { ddd: "66", uf: "MT" },
  { ddd: "67", uf: "MS" },
  { ddd: "68", uf: "AC" },
  { ddd: "69", uf: "RO" },
  { ddd: "71", uf: "BA" }, { ddd: "73", uf: "BA" }, { ddd: "74", uf: "BA" },
  { ddd: "75", uf: "BA" }, { ddd: "77", uf: "BA" },
  { ddd: "79", uf: "SE" },
  { ddd: "81", uf: "PE" }, { ddd: "87", uf: "PE" },
  { ddd: "82", uf: "AL" },
  { ddd: "83", uf: "PB" },
  { ddd: "84", uf: "RN" },
  { ddd: "85", uf: "CE" }, { ddd: "88", uf: "CE" },
  { ddd: "86", uf: "PI" }, { ddd: "89", uf: "PI" },
  { ddd: "91", uf: "PA" }, { ddd: "93", uf: "PA" }, { ddd: "94", uf: "PA" },
  { ddd: "92", uf: "AM" }, { ddd: "97", uf: "AM" },
  { ddd: "95", uf: "RR" },
  { ddd: "96", uf: "AP" },
  { ddd: "98", uf: "MA" }, { ddd: "99", uf: "MA" },
];

const VALID_DDDS = new Set(DDDS.map((item) => item.ddd));

export function isValidDdd(value) {
  return VALID_DDDS.has(onlyDigits(value));
}

// Máscara só do número local, sem o DDD: 99999-9999 (celular) ou
// 9999-9999 (fixo).
export function formatLocalPhone(value) {
  const d = onlyDigits(value).slice(0, 9);
  if (d.length <= 4) return d;
  if (d.length <= 8) return d.replace(/^(\d{4})(\d{0,4})/, "$1-$2");
  return d.replace(/^(\d{5})(\d{0,4})/, "$1-$2");
}

// Vazio é válido: o telefone é opcional.
export function isValidLocalPhone(value) {
  const d = onlyDigits(value);
  if (d.length === 0) return true;
  if (d.length !== 8 && d.length !== 9) return false;
  // Celular no Brasil tem 9 dígitos e sempre começa com 9.
  if (d.length === 9 && d[0] !== "9") return false;
  return true;
}

// Separa o que está salvo no banco (só dígitos, DDD junto) nos dois campos
// da tela.
export function splitPhone(value) {
  const d = onlyDigits(value);
  if (d.length < 10) return { ddd: "", number: "" };
  return { ddd: d.slice(0, 2), number: d.slice(2) };
}

// Junta de volta para salvar. Devolve vazio se faltar alguma das partes —
// meio telefone não serve para nada.
export function joinPhone(ddd, number) {
  const d = onlyDigits(ddd);
  const n = onlyDigits(number);
  if (!d || !n) return "";
  return d + n;
}

// Link direto para a conversa no WhatsApp, usado no painel admin.
export function whatsappLink(value) {
  const d = onlyDigits(value);
  if (d.length !== 10 && d.length !== 11) return "";
  return `https://wa.me/55${d}`;
}
