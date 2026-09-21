// Padroniza o nome da categoria para evitar duplicatas na vitrine por causa
// de digitação: "  maquiagem" e "Maquiagem " viram a mesma "Maquiagem".
// Se uma categoria equivalente já existe, reutiliza exatamente o nome dela.
export function normalizeCategory(value, existingCategories = []) {
  const trimmed = (value || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const match = existingCategories.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (match) return match;

  // Primeira letra maiúscula, resto como o usuário digitou.
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
