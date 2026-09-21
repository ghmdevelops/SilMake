# SilBeauty

E-commerce simples feito em React (Vite) que se conecta direto ao Firebase Realtime Database. Permite cadastrar produtos (com imagem por link ou upload), exibi-los na vitrine e usar um carrinho de compras simples.

## Estrutura

Todo o projeto vive nesta pasta (`client`), inclusive o `netlify.toml`.

```
src/
  firebase.js           -> configuração do Firebase (já preenchida)
  config.js             -> e-mails de admin e dados do Telegram
  hooks/                -> leitura em tempo real (produtos, pedidos, perfil...)
  api/                  -> produtos, pedidos, frete, configurações, métricas
  context/              -> carrinho, favoritos, autenticação, avisos
  components/           -> Navbar, Footer, ProductCard, carrossel, gavetas...
  pages/
    Home.jsx            -> vitrine (busca, filtros, categorias)
    ProductDetail.jsx   -> página do produto
    Cart.jsx            -> carrinho e fechamento do pedido
    Admin.jsx           -> painel de produtos, frete e métricas (exige login)
netlify/functions/      -> funções de servidor (cotação de frete, OAuth)
public/                 -> ícones, robots.txt, sitemap.xml, _redirects
netlify.toml            -> configuração de deploy
```

## Rodando o projeto

```bash
npm install
npm run dev
```

Acesse http://localhost:5173 (ou a porta indicada no terminal).

## Protegendo o painel Admin

O acesso ao `/admin` é protegido por login de verdade (Firebase Authentication) — veja a seção "Login, cadastro e painel Admin" abaixo para os detalhes e o passo a passo de configuração no Firebase Console.

## Login, cadastro e painel Admin (Firebase Authentication)

O site agora tem login de verdade:
- **Clientes**: podem criar conta (e-mail/senha ou Google) em `/cadastro`, entrar em `/login`, recuperar senha em `/esqueci-senha`, e editar nome/sobrenome/endereço de entrega em `/perfil`.
- **Checkout**: ao clicar em "Finalizar compra", o cliente precisa estar logado e ter um endereço salvo no perfil — só então é redirecionado ao WhatsApp (já com a lista de produtos, total e endereço preenchidos).
- **Histórico de pedidos**: cada pedido finalizado fica salvo no perfil do cliente (`/perfil`), marcado como "Fechado".
- **Admin**: o acesso ao `/admin` agora depende de login com uma conta cujo e-mail esteja na lista `ADMIN_EMAILS` em `src/config.js` (hoje configurado com `gehaime43@gmail.com`).
- **Manter conectado**: na tela de login, o cliente pode marcar "Manter conectado" (sessão permanece mesmo fechando o navegador) ou deixar desmarcado (sai automaticamente ao fechar a aba).

### ⚠️ Passo obrigatório no Firebase Console

1. **Ativar os métodos de login**: vá em *Authentication → Sign-in method* e habilite **"E-mail/senha"** e **"Google"**. Sem isso, login/cadastro não funcionam.
2. **Criar a conta de admin**: acesse `/cadastro` no site com o e-mail `gehaime43@gmail.com` (o mesmo que está em `ADMIN_EMAILS`) para criar sua conta de administrador.
3. **Atualizar as regras do Realtime Database** (Realtime Database → Regras), substituindo a regra pública antiga por:

```json
{
  "rules": {
    "products": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'gehaime43@gmail.com'",
      "$productId": {
        "stock": {
          ".write": "auth != null",
          ".validate": "newData.isNumber() && newData.val() >= 0 && (auth.token.email == 'gehaime43@gmail.com' || newData.val() < data.val())"
        }
      }
    },
    "productImages": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'gehaime43@gmail.com'"
    },
    "settings": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'gehaime43@gmail.com'"
    },
    "stats": {
      ".read": "auth != null && auth.token.email == 'gehaime43@gmail.com'",
      "$tipo": {
        "$chave": {
          ".write": true,
          ".validate": "newData.isNumber() && (!data.exists() ? newData.val() == 1 : newData.val() == data.val() + 1)"
        }
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "orders": {
      ".read": "auth != null && auth.token.email == 'gehaime43@gmail.com'",
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || auth.token.email == 'gehaime43@gmail.com')",
        "$orderId": {
          ".write": "auth != null && ((auth.uid == $uid && !data.exists()) || auth.token.email == 'gehaime43@gmail.com')",
          ".validate": "newData.hasChildren(['items', 'total', 'status', 'createdAt'])",
          "status": {
            ".validate": "newData.val() == 'pending' || auth.token.email == 'gehaime43@gmail.com'"
          },
          "total": {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          },
          "subtotal": {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          },
          "shippingFee": {
            ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 500"
          },
          "items": {
            "$index": {
              ".validate": "newData.hasChildren(['id', 'name', 'price', 'quantity'])",
              "price": {
                ".validate": "auth.token.email == 'gehaime43@gmail.com' || (newData.parent().child('id').isString() && newData.val() == root.child('products').child(newData.parent().child('id').val()).child('price').val())"
              },
              "quantity": {
                ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() <= 999"
              }
            }
          }
        }
      }
    }
  }
}
```

O que essa regra garante:
- **Produtos**: todo mundo pode *ler* (para a loja funcionar); só a conta admin pode criar/editar/excluir. **Exceção controlada**: um cliente logado pode alterar apenas o campo `stock`, e apenas para **diminuir** (nunca aumentar) — é isso que permite a baixa automática de estoque quando ele compra.
- **Fotos extras** (`productImages`): leitura pública, escrita só pela conta admin. Guarda a 2ª e a 3ª foto de cada produto — veja "Fotos do produto" mais abaixo para entender por que elas não ficam junto do produto.
- **Configurações** (`settings`): leitura pública (a loja precisa saber o valor do frete antes do login) e escrita só pela conta admin, na aba **Frete** do painel.
- **Estatísticas** (`stats`): qualquer visitante pode **somar 1** a um contador (é assim que a loja registra visitas a produtos), mas **só a conta admin lê** os números. A regra `newData.val() == data.val() + 1` garante que ninguém consegue escrever um valor arbitrário — só incrementar de um em um. Nenhum dado pessoal é gravado ali, apenas contagens.
- **Perfil** (`users`): cada cliente só lê/escreve os **seus próprios** dados.
- **Pedidos** (`orders`): o cliente pode **criar** um pedido novo, mas **não pode mais alterá-lo depois** (a regra `!data.exists()` só libera escrita quando o pedido ainda não existe). Ou seja, ele não consegue mudar o próprio pedido para "Pago", mexer no valor total nem no rastreio. Só a conta admin pode alterar pedidos existentes.
- Na criação, o `status` é obrigatoriamente `"pending"`.
- **Preço de cada item é conferido contra o catálogo**: a regra em `items/$index/price` compara o preço enviado com `products/<id>/price` no banco. Se o cliente tentar enviar um preço diferente do cadastrado, o Firebase **rejeita o pedido inteiro**. Isso fecha a principal brecha de manipulação de valores sem precisar de servidor próprio.
- A `quantity` precisa ser um número entre 1 e 999, e o `shippingFee` tem que ser um número entre 0 e 500.

⚠️ **Por que o frete não é validado com exatidão:** com a cotação do Melhor Envio, o valor do frete é definido pela transportadora no momento da compra — muda conforme CEP, peso e data, e nem a regra do Firebase nem o painel conseguem recalcular depois qual era o valor naquele instante. Por isso a regra apenas limita a faixa (0 a 500). Na prática isso não é grave: **você confirma o pagamento manualmente antes de enviar**, e o pedido guarda qual serviço foi cotado (`shippingService`), então uma divergência aparece na hora de comprar a etiqueta.

⚠️ **Limitação que permanece** (sem servidor próprio): as regras do Firebase não têm laço/soma, então o campo `total` não pode ser recalculado por elas. Com os preços, quantidades e frete já validados individualmente, a única manipulação possível é enviar um `total` que não corresponde à soma. Para cobrir isso, o painel admin **recalcula o valor esperado de todo pedido** e exibe um alerta vermelho de "Valor divergente" na lista e no detalhe do pedido — então você vê a diferença antes de confirmar o envio. Uma Cloud Function eliminaria até esse caso.

⚠️ **Outra porta conhecida**: como o cliente precisa poder **diminuir** o estoque (para a baixa automática funcionar), alguém mal-intencionado poderia zerar o estoque de um produto por sabotagem. Ele não consegue aumentar, e você reverte em segundos no admin — mas vale saber que existe.

⚠️ Se você adicionar mais e-mails em `ADMIN_EMAILS` no futuro, lembre-se de atualizar também o e-mail (ou lista de e-mails) nessa regra do Firebase — eles não se sincronizam automaticamente, já que a regra vive no console do Firebase, fora do código do site.

### Painel Admin → aba "Pedidos"

Além de cadastrar produtos, o `/admin` agora tem uma segunda aba, **Pedidos**, mostrando todos os pedidos feitos pelos clientes (de todas as contas), com:
- Nome/e-mail do cliente, itens comprados, endereço de entrega e valor total
- Contador de pedidos pendentes e total já recebido (somando só os marcados como pagos)
- Filtro por "Todos / Pendentes / Pagos"
- Botão **"Marcar como pago"** — como ainda não existe integração automática de pagamento, é assim que você confirma manualmente que recebeu o pagamento de um pedido (feito via PIX, dinheiro, etc. combinado pelo WhatsApp)

## Deploy no Netlify

O arquivo `netlify.toml` fica **dentro desta pasta**, junto com o projeto. Ele já configura:
- `command = "npm run build"` e `publish = "dist"`
- `NODE_VERSION = "22"`, para o build não quebrar sozinho quando o Netlify mudar a versão padrão
- A pasta das funções serverless (`netlify/functions`)
- As rotas `/api/...` para as funções e o redirect de todas as outras rotas para `index.html`, necessário para o React Router (ex: acessar `/produto/xyz` direto pela URL)
- Cabeçalhos de segurança e de cache

### ⚠️ Passo obrigatório: Base directory

O Netlify só encontra esse arquivo se souber que o projeto está em `client`. Em *Site configuration → Build & deploy → Build settings*, preencha:

```
Base directory = client
```

Sem isso, o Netlify procura o `netlify.toml` na raiz do repositório, não acha, e **ignora tudo o que está escrito nele** — inclusive as rotas `/api/...`. O sintoma é a cotação de frete responder **404**.

Como rede de segurança, as mesmas rotas estão duplicadas em `public/_redirects`, que é copiado para dentro do `dist` durante o build e vale mesmo que o `netlify.toml` não seja lido.

Passos para publicar:
1. Suba o repositório para o GitHub/GitLab.
2. No Netlify, crie um novo site com "Import from Git" apontando para esse repositório.
3. Defina o **Base directory** como `client` (veja o aviso acima).
4. Cadastre as variáveis de ambiente (veja a seção do Melhor Envio).
5. Depois do deploy, siga o passo a passo da seção "Login, cadastro e painel Admin" para ativar o Firebase Authentication e as regras do banco.

## Fotos do produto (até 3)

Cada produto aceita **até três fotos**, adicionadas por link ou upload na aba Produtos do `/admin`. A primeira é a **principal**: é ela que aparece na vitrine, no carrinho e nos pedidos. As outras duas aparecem só na página do produto, como miniaturas abaixo da foto grande. Dá para reordenar clicando em "Tornar principal".

### Por que as fotos extras ficam num nó separado

Fotos enviadas por upload são reduzidas para 800px e gravadas **dentro do banco**, em base64 (~150 KB cada). E a vitrine escuta o nó `products` **inteiro** — ou seja, todo visitante baixa todos os campos de todos os produtos, sempre.

Se as três fotos ficassem juntas do produto, cada cliente baixaria na página inicial a 2ª e a 3ª foto de itens que talvez nem abrisse. Com 20 produtos isso passaria de 9 MB só para exibir a vitrine.

Por isso a divisão:

| Onde | O quê | Quando é baixado |
|---|---|---|
| `products/<id>/image` | foto principal | sempre (a vitrine precisa) |
| `productImages/<id>` | 2ª e 3ª fotos | só ao abrir aquele produto |

Arquivos: `src/api/productImages.js` (leitura/escrita) e `src/utils/imageResize.js` (compressão).

⚠️ Para uploads, prefira fotos já recortadas e leves. Se for usar imagem hospedada fora (link), melhor ainda: não ocupa espaço no banco.

## Cotação real de frete (Melhor Envio)

O cliente informa o CEP no carrinho e escolhe entre as opções reais de envio (PAC, SEDEX, Jadlog...), com preço e prazo vindos do **Melhor Envio**. É gratuito: não há mensalidade nem taxa pela API.

### Por que existe uma função de servidor

A consulta é feita em `netlify/functions/shipping-quote.mjs`, uma **função serverless**, e não no código do site. Dois motivos:
1. O token do Melhor Envio dá acesso à sua conta. No JavaScript da loja, qualquer visitante poderia lê-lo abrindo o navegador.
2. A API do Melhor Envio bloqueia chamadas feitas direto do navegador (CORS).

### Autenticação por token fixo (é o que está em uso)

No painel do Melhor Envio, em **Integrações → Área Dev → Tokens**, dá para gerar um token de acesso direto, de validade longa. É o caminho mais simples para quem tem uma loja só: preenchendo `MELHOR_ENVIO_TOKEN`, a cotação já funciona — **sem cadastrar aplicativo, sem autorizar e sem callback**.

Variáveis a cadastrar no Netlify (**Site settings → Environment variables**):

| Variável | Valor |
|---|---|
| `MELHOR_ENVIO_TOKEN` | o token gerado no painel |
| `MELHOR_ENVIO_ENV` | `sandbox` para testar ou `production` para valer |
| `MELHOR_ENVIO_USER_AGENT` | `SilBeauty (seu-email@exemplo.com)` |

⚠️ O token pertence ao ambiente onde foi gerado. Token de sandbox com `MELHOR_ENVIO_ENV=production` (ou o contrário) é recusado — nesse caso a função responde `invalid_token` dizendo exatamente isso.

⚠️ O token gerado no painel vem com **todos os escopos**, incluindo comprar etiqueta usando o saldo da conta. Trate como senha: nunca no código, só em variável de ambiente. Se vazar, revogue no painel e gere outro.

Faltam ainda dois ajustes no `/admin` → aba **Frete**:
1. Preencher o **CEP de origem** — sem ele a cotação responde erro 400.
2. Conferir **peso e dimensões** no cadastro de cada produto. Quem não tiver medidas usa a embalagem padrão de cosméticos, e há atalhos para pequeno/médio/grande.

### Alternativa: aplicativo OAuth

O código também aceita o fluxo OAuth completo. Ele **só entra em ação quando `MELHOR_ENVIO_TOKEN` está vazio**.

Nesse modo você cadastra um aplicativo (**Integrações → Área Dev → Cadastrar Aplicativo**), recebe um **Client ID** e um **Client Secret** (variáveis `MELHOR_ENVIO_CLIENT_ID` e `MELHOR_ENVIO_CLIENT_SECRET`), e autoriza a loja uma vez em `/admin` → aba **Frete** → "Conectar conta do Melhor Envio". O acesso expira em 30 dias e é renovado sozinho pela função, três dias antes de vencer.

Como esses tokens mudam sozinhos, eles não cabem numa variável de ambiente: são gravados no [Netlify Blobs](https://docs.netlify.com/blobs/overview/). Em desenvolvimento local, vão para `.netlify/` (ignorado pelo Git).

No campo de **callback (redirect URI)** do aplicativo, cadastre exatamente:
```
https://SEU-SITE.netlify.app/api/melhorenvio/callback
```
⚠️ Se esse endereço não for idêntico, o Melhor Envio responde `Client invalid` e a autorização falha.

⚠️ Sandbox e produção têm **aplicativos e autorizações separados** — ao trocar de ambiente, é preciso cadastrar o aplicativo de novo e conectar outra vez.

Arquivos envolvidos:
| Arquivo | Papel |
|---|---|
| `lib/melhorEnvio.mjs` | configuração, token fixo, guarda e renovação dos tokens OAuth |
| `melhorenvio-connect.mjs` | leva você à tela de autorização (só no modo OAuth) |
| `melhorenvio-callback.mjs` | recebe a autorização e grava os tokens (só no modo OAuth) |
| `melhorenvio-status.mjs` | diz ao painel se está conectado |
| `shipping-quote.mjs` | cota o frete usando o token válido |

### Segurança do fluxo

- O token **nunca é enviado ao navegador**: a função de status devolve só "conectado ou não".
- No modo OAuth, a autorização usa um parâmetro `state` aleatório conferido na volta, o que impede uma autorização forjada (CSRF), e pedimos **apenas** a permissão `shipping-calculate`.
- No modo de token fixo esse controle de escopo não existe: o painel do Melhor Envio gera o token com todos os escopos. É o preço da simplicidade — por isso a recomendação de revogar e regerar caso ele vaze.

### Testando localmente

O `vite.config.js` executa as **mesmas funções** no `npm run dev`. Copie `.env.example` para `.env` (ignorado pelo Git), preencha `MELHOR_ENVIO_TOKEN`, `MELHOR_ENVIO_ENV` e `MELHOR_ENVIO_USER_AGENT`, e reinicie o servidor.

Para conferir se a integração está de pé:
```bash
curl http://localhost:5173/api/melhorenvio/status
```
Resposta esperada com token fixo: `{"configured":true,"connected":true,"environment":"production","mode":"token"}`

Se optar pelo modo OAuth, cadastre **também** este callback no aplicativo do Melhor Envio (eles aceitam vários):
```
http://localhost:5173/api/melhorenvio/callback
```

#### ⚠️ Rede com proxy corporativo

Se a cotação falhar com `fetch failed`, o problema é o Node não confiar no certificado do proxy da rede — não é bloqueio. Use o script alternativo:

```
npm run dev:proxy
```

Ele é igual ao `npm run dev`, só adiciona a flag `--use-system-ca`, que faz o Node usar os certificados instalados no Windows (os mesmos que o navegador usa). O mesmo vale para os scripts da pasta `scripts/`: rode com `node --use-system-ca`.

Em produção (Netlify) isso não é necessário — o servidor deles não tem proxy no meio.

### O que acontece antes de configurar

A loja **não quebra**. Se a função não existir (rodando local com `npm run dev`), se o token não estiver configurado ou se o Melhor Envio estiver fora do ar, a cotação é marcada como indisponível e a loja usa o **frete de reserva** definido na aba Frete — junto com a regra de frete grátis acima de um valor, que continua funcionando normalmente e tem prioridade sobre qualquer cotação.

### Peso e dimensões

Produtos sem medidas cadastradas usam a embalagem padrão (0,3 kg e 16×11×6 cm), pensada para cosméticos. Isso evita que a cotação falhe, mas **cotação fiel exige medidas reais** — na lista de produtos do admin, os itens sem medidas aparecem com o selo `📦 sem medidas`. As dimensões enviadas são sempre elevadas ao mínimo aceito pelos Correios (16×11×2 cm), senão a requisição é recusada.

## Medição (analytics)

A loja mede de duas formas independentes.

### 1. Contadores próprios (funcionam sem configurar nada)

Gravados no próprio Firebase, em `stats/`, e exibidos no `/admin` → aba **Métricas**:

| Painel | O que mostra | Para que serve |
|---|---|---|
| **Interesse x venda** | visitas 👁, adições ao carrinho 🛒, unidades vendidas ✅ e a taxa de conversão de cada produto | achar o produto que atrai muita gente e não vende — quase sempre é preço, foto ou descrição |
| **Procuraram e não acharam** | termos buscados que não retornaram nenhum produto | é o que seus clientes querem comprar e você ainda não tem |

Detalhes de implementação:
- A soma é feita com `increment()` no servidor do Firebase, de forma atômica. Por isso a regra do banco pode liberar apenas "somar 1" sem dar leitura pública dos números.
- A visita a um produto é contada **uma vez por aba** (guardado em `sessionStorage`), então recarregar a página não infla o número.
- São contagens anônimas e agregadas — nenhum dado pessoal, nenhum cookie. Por isso funcionam independente do consentimento.
- Se as regras não estiverem publicadas, a gravação falha **em silêncio**: medição nunca deve quebrar a loja nem poluir o console do cliente.

### 2. Google Analytics 4 (opcional)

Desligado por padrão. Para ativar, coloque o ID de medição no `.env`:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Você obtém esse ID criando uma propriedade no Google Analytics, ou habilitando o Google Analytics no seu projeto do Firebase (o `firebaseConfig` atual **não** tem `measurementId`, ou seja, ainda não está habilitado).

Como foi implementado:
- O script do Google é carregado **sob demanda, direto do CDN deles**, e apenas **depois** do cliente clicar em "Aceitar" no banner de cookies. Quem recusa não dispara nenhuma requisição.
- Não entra no bundle da loja, então não pesa para quem recusar.
- "Recusar" desliga a medição e apaga os cookies `_ga`/`_gid` já existentes — o botão tem efeito real, não é enfeite.
- Envia `page_view` a cada navegação (necessário numa aplicação de página única) e o evento `purchase` no padrão de e-commerce do GA4, com itens, frete e valor.
- Usa `anonymize_ip`.

⚠️ Sem o `VITE_GA_MEASUREMENT_ID`, todas as funções de medição viram no-op — nada é carregado e nada quebra.

## Aviso automático de novo pedido (Telegram)

Quando o cliente clica em **"Finalizar compra"**, ele **não é mais redirecionado** para lugar nenhum — ele só vê uma mensagem de "Pedido enviado com sucesso!". Por trás dos panos, o pedido é salvo no Firebase (aparece no `/admin`) **e** uma notificação é enviada automaticamente para o seu Telegram, sem nenhuma ação do cliente.

Isso existe porque o WhatsApp não permite enviar mensagens de forma automática/invisível a partir de um site sem servidor — sempre precisaria abrir o WhatsApp e o cliente apertar "enviar" manualmente. O Telegram, por outro lado, tem uma API pública gratuita que permite isso.

### Como configurar (leva uns 5 minutos)

1. **Crie o bot**: no Telegram, procure por `@BotFather`, envie `/newbot` e siga as instruções (escolha um nome e um username terminado em "bot"). No final ele te dá um **token**, algo como `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`.
2. **Pegue seu chat ID**: envie qualquer mensagem para o bot que você acabou de criar (procure pelo username dele e mande um "oi"). Depois, no navegador, acesse:
   ```
   https://api.telegram.org/bot<SEU_TOKEN>/getUpdates
   ```
   (troque `<SEU_TOKEN>` pelo token do passo 1). Vai aparecer um JSON com `"chat":{"id": 123456789, ...}` — esse número é o seu **chat ID**.
3. **Configure no projeto**: abra `src/config.js` e preencha:
   ```js
   export const TELEGRAM_BOT_TOKEN = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ";
   export const TELEGRAM_CHAT_ID = "123456789";
   ```
4. Pronto — a partir do próximo pedido finalizado, a mensagem chega automaticamente no seu Telegram.

⚠️ Enquanto esses valores não forem preenchidos (ficarem como `"COLOQUE_..."`), o site continua funcionando normalmente (o pedido é salvo no Firebase de qualquer forma), só a notificação do Telegram não é enviada — vai aparecer um aviso no console do navegador lembrando disso.

## Favoritos

Os usuários podem clicar no coração (♡) de qualquer produto para salvá-lo como favorito. A lista fica salva no navegador (localStorage) e pode ser vista em `/favoritos`, com contador no menu.

## PWA (app instalável)

O site agora é um PWA completo (via `vite-plugin-pwa`):
- **Instalável**: no Chrome/Edge (desktop e Android), aparece um prompt customizado convidando a instalar o app na tela inicial. No iOS/Safari, o usuário pode usar "Adicionar à Tela de Início" pelo menu de compartilhar.
- **Ícones**: gerados em `public/` (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`) a partir do logo da marca. Se quiser regenerar (por exemplo, depois de mudar o `favicon.svg`), rode:
  ```bash
  node scripts/generate-icons.mjs
  ```
- **Funciona offline (parcialmente)**: um Service Worker (gerado automaticamente no build) faz cache dos arquivos do app (HTML, CSS, JS, ícones) e das imagens de produtos, então depois da primeira visita o site abre rápido e continua navegável mesmo com internet instável. Os dados do Firebase (lista de produtos) precisam de conexão para atualizar em tempo real.
- O Service Worker só é gerado no **build de produção** (`npm run build` / Netlify). No `npm run dev` ele não é ativado, para não interferir no desenvolvimento.

## SEO

O projeto já inclui o básico de SEO:
- Meta tags de descrição, palavras-chave, Open Graph e Twitter Card no `index.html`
- Dados estruturados (JSON-LD) informando que o site é uma loja online
- Título e descrição dinâmicos por página (via `src/hooks/useSeo.js`), inclusive por produto
- `public/robots.txt` e `public/sitemap.xml`
- Páginas de conteúdo: **Sobre** (`/sobre`), **FAQ** (`/faq`), **Política de Privacidade** (`/politica-de-privacidade`) e **Termos de Uso** (`/termos-de-uso`), linkadas no rodapé e no menu

⚠️ **Importante**: os arquivos `index.html`, `robots.txt` e `sitemap.xml` usam a URL de exemplo `https://silbeauty.netlify.app/`. Depois que você publicar e souber o endereço final do site (o domínio que o Netlify gerar, ou um domínio próprio), troque essa URL nesses três arquivos para o SEO funcionar corretamente.

## Sobre as imagens

No painel Admin você pode:
- Colar um **link (URL)** de uma imagem já hospedada em algum lugar; ou
- Fazer **upload de um arquivo** do computador — a imagem é convertida em base64 e salva direto no Realtime Database.

Upload de arquivo é prático, mas gera registros maiores no banco. Para uma loja com muitas fotos em alta resolução, o ideal futuramente é usar o Firebase Storage.
