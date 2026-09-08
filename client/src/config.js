// Configurações gerais da loja. Ajuste os valores abaixo conforme necessário.

// Número de WhatsApp da loja, com código do país e DDD, somente números.
// Exemplo real: "5511912345678" (55 = Brasil, 11 = DDD, resto é o número).
export const WHATSAPP_NUMBER = "5511981835197";

export function buildWhatsappLink(message = "") {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${WHATSAPP_NUMBER}${text}`;
}

// E-mails que têm acesso ao painel /admin. Quem fizer login com um desses
// e-mails (via Firebase Authentication) vê o link "Painel Admin" e pode acessar.
export const ADMIN_EMAILS = ["gehaime43@gmail.com"];

