// Confere se as credenciais do Melhor Envio estão válidas, SEM expor o segredo.
//
// Como rodar (dentro da pasta client):
//   node --use-system-ca --env-file=.env scripts/check-melhor-envio.mjs
//
// A flag --use-system-ca é necessária em redes com proxy corporativo; sem ela
// o Node não confia no certificado e a conexão falha com "fetch failed".
//
// Como o teste funciona: pedimos um token usando um código de autorização
// falso. A resposta diferencia os casos:
//   invalid_client -> Client ID/Secret não conferem
//   invalid_grant  -> credenciais OK (o erro é só o código falso)

const BASES = {
  sandbox: "https://sandbox.melhorenvio.com.br",
  production: "https://melhorenvio.com.br",
};

const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
const userAgent = process.env.MELHOR_ENVIO_USER_AGENT || "SilBeauty (contato@exemplo.com)";

if (!clientId || !clientSecret) {
  console.error("Credenciais não encontradas. Rode com --env-file=.env e preencha:");
  console.error("  MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET");
  process.exit(1);
}

console.log(`Client ID:  ${clientId}`);
console.log(`Secret:     ${clientSecret.length} caracteres`);
console.log(`User-Agent: ${userAgent}\n`);

// Um domínio real evita o firewall do Melhor Envio, que bloqueia requisições
// com "localhost" no redirect_uri (respondendo 403 em HTML).
const redirectUri = "https://silbeauty.netlify.app/api/melhorenvio/callback";

for (const [environment, base] of Object.entries(BASES)) {
  try {
    const res = await fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: "codigo-invalido-de-proposito",
      }),
    });

    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      // resposta em HTML = firewall no meio do caminho
    }

    const erro = data.error || "";
    let veredito;

    if (erro === "invalid_client") veredito = "❌ credenciais recusadas";
    else if (erro === "invalid_grant" || /code/i.test(data.error_description || ""))
      veredito = "✅ credenciais VÁLIDAS";
    else if (text.startsWith("<html")) veredito = "⚠️ bloqueado por firewall (não conclusivo)";
    else veredito = `⚠️ resposta inesperada: ${erro || res.status}`;

    console.log(`${environment.padEnd(11)} HTTP ${res.status}  ${veredito}`);
  } catch (err) {
    console.log(`${environment.padEnd(11)} falha de rede: ${err.message}`);
    console.log("            (em rede com proxy, rode com --use-system-ca)");
  }
}

console.log(
  "\nLembre: o app do SANDBOX e o de PRODUÇÃO são cadastrados em painéis" +
    "\nseparados e têm credenciais diferentes."
);
