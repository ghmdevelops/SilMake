// Deixa o texto comparável na busca: minúsculo e sem acentos.
// Assim "Sabonete Açaí" é encontrado digitando "sabonete acai".
export function normalizeText(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Verifica se o termo buscado aparece em algum dos campos informados.
export function matchesSearch(term, fields) {
  const normalizedTerm = normalizeText(term).trim();
  if (!normalizedTerm) return true;

  return fields
    .filter(Boolean)
    .some((field) => normalizeText(field).includes(normalizedTerm));
}
