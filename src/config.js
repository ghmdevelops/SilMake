// Configurações gerais da loja. Ajuste os valores abaixo conforme necessário.

// E-mails que têm acesso ao painel /admin. Quem fizer login com um desses
// e-mails (via Firebase Authentication) vê o link "Painel Admin" e pode acessar.
export const ADMIN_EMAILS = ["gehaime43@gmail.com"];

// O bot do Telegram NÃO fica mais aqui.
//
// Este arquivo vai inteiro para o JavaScript que o visitante baixa — o token
// ficava legível para qualquer pessoa. Agora ele mora nas variáveis de
// ambiente do Netlify (TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID) e é usado só
// pela função netlify/functions/notify-order.mjs, no servidor.

