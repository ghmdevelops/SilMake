// Consulta o ViaCEP para preencher o endereço automaticamente.
// É gratuito, não exige cadastro nem token e permite chamadas direto do
// navegador — por isso pode ser usado sem servidor próprio.
export async function fetchAddressByCep(cep) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.erro) return null;

  return {
    street: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}

export function onlyDigits(value) {
  return (value || "").replace(/\D/g, "");
}

// Formata progressivamente enquanto o cliente digita: 01234567 → 01234-567
export function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
