<div align="center">

<img src="public/og-image.jpg" alt="SilBeauty — beleza e cuidado" width="620" />

<br />

**Loja online de maquiagem, skincare e perfumaria.**
Vitrine, carrinho, pedidos, frete calculado e painel de gestão — tudo numa aplicação só.

<br />

[![React](https://img.shields.io/badge/React-19-16161c?style=flat-square&logo=react&logoColor=ec6f9b)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-16161c?style=flat-square&logo=vite&logoColor=ec6f9b)](https://vite.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-16161c?style=flat-square&logo=firebase&logoColor=ec6f9b)](https://firebase.google.com)
[![Netlify](https://img.shields.io/badge/Netlify-Functions-16161c?style=flat-square&logo=netlify&logoColor=ec6f9b)](https://netlify.com)
[![PWA](https://img.shields.io/badge/PWA-instal%C3%A1vel-16161c?style=flat-square&logo=pwa&logoColor=ec6f9b)](#pwa-app-instalável)

**[silbeauty.netlify.app](https://silbeauty.netlify.app)**

</div>

---

## O que a loja faz

<table>
<tr>
<td width="50%" valign="top">

### 🛍️ Para quem compra

- Vitrine com busca que **ignora acentos**, filtros por categoria, preço e ordenação
- Página do produto com **até 3 fotos**, zoom, relacionados e vistos recentemente
- Carrinho com **frete real** (Melhor Envio) e frete grátis por valor
- Conta própria: pedidos, endereço, CPF e avatar
- Favoritos, compartilhar produto e **arte pronta para Stories**
- Página de **dicas de beleza** com 66 orientações práticas
- Funciona como **app instalável** no celular

</td>
<td width="50%" valign="top">

### 📊 Para quem vende

- Cadastro de produtos com fotos, estoque, medidas e **custo**
- Pedidos com status, rastreio e **lista de separação imprimível**
- Métricas: faturamento, **lucro e margem**, ticket médio e conversão
- **Relatório de reposição**: o que acaba primeiro
- Buscas sem resultado — o que pedem e você não tem
- Pedido manual, clientes, exportação em CSV
- Aviso de venda **no seu Telegram**, na hora

</td>
</tr>
</table>

---

## Começando

```bash
npm install
npm run dev
```

Abra http://localhost:5173 (ou a porta indicada no terminal).

> ⚠️ Antes do primeiro uso, o Firebase precisa de configuração: **métodos de login** e **regras do banco**. Veja [Passo obrigatório no Firebase Console](#️-passo-obrigatório-no-firebase-console).

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor local, com as funções do Netlify emuladas |
| `npm run build` | Gera o site em `dist/` |
| `npm run lint` | Verifica o código |
| `npm run sitemap` | Regenera o `sitemap.xml` com os produtos |
| `npm run og-image` | Regenera a imagem de prévia dos links |

---

## Como o projeto está organizado

Todo o projeto vive nesta pasta (`client`), inclusive o `netlify.toml`.

```
src/
  firebase.js           -> configuração do Firebase e App Check
  config.js             -> e-mails com acesso ao painel
  hooks/                -> leitura em tempo real (produtos, pedidos, perfil...)
  api/                  -> produtos, custos, fotos, pedidos, frete, métricas
  context/              -> carrinho, favoritos, autenticação, avisos
  components/           -> Navbar, ProductCard, carrossel, ícones, gavetas...
  data/beautyTips.js    -> conteúdo da página de dicas
  utils/                -> preço, estoque, CPF, telefone, arte de Stories
  pages/
    Home.jsx            -> vitrine (busca, filtros, categorias)
    ProductDetail.jsx   -> página do produto
    Cart.jsx            -> carrinho e fechamento do pedido
    Admin.jsx           -> painel de produtos, frete e métricas (exige login)
netlify/functions/      -> funções de servidor (frete, Telegram, OAuth)
scripts/                -> ícones, sitemap, imagem de prévia, migrações
public/                 -> ícones, robots.txt, sitemap.xml, _redirects
firebase-rules.json     -> regras do banco, prontas para colar no console
netlify.toml            -> configuração de deploy
```

### Onde fica cada coisa

| Preciso mexer em... | Arquivo |
|---|---|
| Quem acessa o painel | `src/config.js` |
| Regras de segurança do banco | `firebase-rules.json` |
| Texto das dicas de beleza | `src/data/beautyTips.js` |
| Cores e fontes | `src/index.css` (variáveis no topo) |
| Ícones da interface | `src/components/icons.jsx` |
| Rotas e cabeçalhos do deploy | `netlify.toml` |

---

## Acesso ao painel

O `/admin` é protegido por login real (Firebase Authentication). Só entra quem faz login com um e-mail listado em `ADMIN_EMAILS`, em `src/config.js`.

A proteção que **de fato** importa não é essa tela: são as regras do Firebase. Mesmo que alguém force a rota no navegador, o banco recusa qualquer escrita que não venha da conta admin.

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
3. **Atualizar as regras do Realtime Database** (Realtime Database → Regras). O conteúdo está em `firebase-rules.json`, na raiz de `client/` — copie o arquivo inteiro e cole no console. É a versão oficial; o bloco abaixo é o mesmo, repetido aqui para leitura:

`json
{
  "rules": {
    "products": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'gehaime43@gmail.com'"
    },

    "productImages": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'gehaime43@gmail.com'"
    },

    "productCosts": {
      ".read": "auth != null && auth.token.email == 'gehaime43@gmail.com'",
      ".write": "auth != null && auth.token.email == 'gehaime43@gmail.com'",
      "$productId": {
        ".validate": "newData.isNumber() && newData.val() >= 0"
      }
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
        ".write": "auth != null && auth.uid == $uid",
        "avatarPhoto": {
          ".validate": "newData.isString() && newData.val().length <= 60000"
        },
        "$campo": {
          ".validate": "!newData.isString() || newData.val().length <= 300"
        }
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
            ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100000"
          },
          "subtotal": {
            ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100000"
          },
          "shippingFee": {
            ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 500"
          },
          "createdAt": {
            ".validate": "auth.token.email == 'gehaime43@gmail.com' || (newData.isNumber() && newData.val() <= now + 60000)"
          },
          "customerName": {
            ".validate": "newData.isString() && newData.val().length <= 120"
          },
          "customerEmail": {
            ".validate": "newData.isString() && newData.val().length <= 160"
          },
          "items": {
            ".validate": "!newData.hasChild('60')",
            "$index": {
              ".validate": "newData.hasChildren(['id', 'name', 'price', 'quantity'])",
              "id": {
                ".validate": "newData.isString() && newData.val().length <= 64"
              },
              "name": {
                ".validate": "newData.isString() && newData.val().length <= 200"
              },
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
- **Produtos**: todo mundo pode *ler* (para a loja funcionar); **só a conta admin escreve**, inclusive no estoque. Até pouco tempo havia uma exceção que deixava qualquer cliente logado diminuir o campo `stock`, para a baixa acontecer no checkout. Ela foi removida: bastava criar uma conta para zerar o estoque da loja inteira. Agora a baixa acontece quando **você confirma o pagamento** — veja "Como o estoque é baixado" abaixo.
- **Fotos extras** (`productImages`): leitura pública, escrita só pela conta admin. Guarda a 2ª e a 3ª foto de cada produto — veja "Fotos do produto" mais abaixo para entender por que elas não ficam junto do produto.
- **Custos** (`productCosts`): **leitura e escrita só pela conta admin**. É o único nó do banco que o público não lê. Guarda quanto você pagou por cada produto.

  ⚠️ Esse dado **não pode** voltar para dentro de `products`. Aquele nó tem leitura pública (a vitrine precisa dos produtos sem login), e a permissão do Firebase é por nó, não por campo — não há como liberar o preço e esconder o custo no mesmo lugar. Com o custo em `products`, qualquer pessoa via a sua margem abrindo `https://<seu-banco>.firebaseio.com/products.json` no navegador, sem login e sem ferramenta.

  Se você tem produtos cadastrados de antes dessa mudança, rode a migração uma vez:

  ```bash
  node scripts/migrate-costs.mjs            # mostra o que faria
  node scripts/migrate-costs.mjs --aplicar  # move de verdade
  ```
- **Configurações** (`settings`): leitura pública (a loja precisa saber o valor do frete antes do login) e escrita só pela conta admin, na aba **Frete** do painel.
- **Estatísticas** (`stats`): qualquer visitante pode **somar 1** a um contador (é assim que a loja registra visitas a produtos), mas **só a conta admin lê** os números. A regra `newData.val() == data.val() + 1` garante que ninguém consegue escrever um valor arbitrário — só incrementar de um em um. Nenhum dado pessoal é gravado ali, apenas contagens.
- **Perfil** (`users`): cada cliente só lê/escreve os **seus próprios** dados.
- **Pedidos** (`orders`): o cliente pode **criar** um pedido novo, mas **não pode mais alterá-lo depois** (a regra `!data.exists()` só libera escrita quando o pedido ainda não existe). Ou seja, ele não consegue mudar o próprio pedido para "Pago", mexer no valor total nem no rastreio. Só a conta admin pode alterar pedidos existentes.
- Na criação, o `status` é obrigatoriamente `"pending"`.
- **Preço de cada item é conferido contra o catálogo**: a regra em `items/$index/price` compara o preço enviado com `products/<id>/price` no banco. Se o cliente tentar enviar um preço diferente do cadastrado, o Firebase **rejeita o pedido inteiro**. Isso fecha a principal brecha de manipulação de valores sem precisar de servidor próprio.
- A `quantity` precisa ser um número entre 1 e 999, e o `shippingFee` tem que ser um número entre 0 e 500.

⚠️ **Por que o frete não é validado com exatidão:** com a cotação do Melhor Envio, o valor do frete é definido pela transportadora no momento da compra — muda conforme CEP, peso e data, e nem a regra do Firebase nem o painel conseguem recalcular depois qual era o valor naquele instante. Por isso a regra apenas limita a faixa (0 a 500). Na prática isso não é grave: **você confirma o pagamento manualmente antes de enviar**, e o pedido guarda qual serviço foi cotado (`shippingService`), então uma divergência aparece na hora de comprar a etiqueta.

⚠️ **Limitação que permanece** (sem servidor próprio): as regras do Firebase não têm laço/soma, então o campo `total` não pode ser recalculado por elas. Com os preços, quantidades e frete já validados individualmente, a única manipulação possível é enviar um `total` que não corresponde à soma. Para cobrir isso, o painel admin **recalcula o valor esperado de todo pedido** e exibe um alerta vermelho de "Valor divergente" na lista e no detalhe do pedido — então você vê a diferença antes de confirmar o envio. Uma Cloud Function eliminaria até esse caso.

### Como o estoque é baixado

A baixa acontece **quando você confirma o pagamento** no painel, e não quando o cliente finaliza a compra.

| Mudança de status | O que acontece no estoque |
|---|---|
| Pendente → Pago | Sai do estoque |
| Pago → Enviado / Finalizado | Nada (os dois já seguram) |
| Pago → Encerrado | Volta para o estoque |
| Encerrado → Pago | Sai de novo |

**Por que não é mais no checkout:** para o navegador do cliente dar baixa, a regra do Firebase precisava liberar escrita no campo `stock` para qualquer pessoa logada. Bastava criar uma conta e rodar um script para zerar o estoque da loja inteira. Movendo a baixa para a confirmação, `stock` passou a ser escrita exclusiva do admin e o buraco fechou.

⚠️ **A troca que isso implica:** o estoque não fica mais reservado no momento do pedido. Dois clientes conseguem pedir a última unidade antes de você confirmar qualquer um dos dois. Nesse caso, ao confirmar o segundo, o painel avisa **"faltou estoque para: ..."** e o status muda mesmo assim — quem decide o que fazer é você. O carrinho continua barrando quem tenta pedir mais do que existe no momento da compra.

A eliminação completa dos dois problemas exigiria criar o pedido e baixar o estoque num servidor (Cloud Function ou função do Netlify com chave de administrador), de forma atômica.

⚠️ **Limitação relacionada**: o arquivo `src/utils/stockSync.js` concentra essa lógica. Se um dia você acrescentar um status novo, lembre-se de dizer lá se ele segura estoque ou não (`STOCK_HELD_STATUSES`, em `src/utils/orderStatus.js`).

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

## SEO e compartilhamento

### Imagem de prévia dos links

Quando alguém cola um link da loja no WhatsApp, Instagram ou Facebook, aparece um cartão com imagem, título e descrição. Sem imagem, esse cartão vira um retângulo de texto cinza — e quase ninguém clica.

A imagem fica em `public/og-image.jpg` (1200×630, o tamanho que essas redes esperam) e é gerada por script:

```bash
npm run og-image
```

Para mudar o texto ou as cores, edite o SVG dentro de `scripts/generate-og-image.mjs` e rode de novo.

### ⚠️ Limitação importante: prévia por produto

As páginas de produto definem a própria imagem e descrição pelo `useSeo`. **Isso funciona no Google, mas não no WhatsApp.**

O motivo: o Google executa o JavaScript antes de indexar; os robôs do WhatsApp, Facebook e Telegram **não**. Eles leem o HTML cru, que é sempre o mesmo `index.html`. Na prática, compartilhar o link de um produto específico mostra a imagem padrão da loja, não a foto daquele produto.

Resolver isso exige entregar HTML já pronto para os robôs — uma Edge Function do Netlify que injeta as tags lendo o produto pela API REST do Firebase. Não está implementado.

Enquanto isso, o botão **"Arte para Stories"** (em cada produto) cobre o caso prático: gera a imagem do produto pronta para postar.

### Dados estruturados

A página de produto publica um bloco JSON-LD do tipo `Product` (`src/hooks/useProductSchema.js`), com preço, disponibilidade e preço antigo. É o que permite ao Google mostrar **"R$ 15,00 · Em estoque"** direto no resultado da busca.

### Sitemap

O `public/sitemap.xml` inclui as páginas fixas **e cada página de produto**, que são as que realmente trazem visita de busca. Regenere quando o catálogo mudar bastante:

```bash
npm run sitemap
```

Ele lê o catálogo pela API REST do Firebase (produtos são de leitura pública, não precisa de credencial) e ignora os pausados. Se a rede falhar, gera só com as páginas fixas em vez de quebrar.

### Endereço canônico

O `useSeo` define o `canonical` de cada página **sem os parâmetros de busca**. Sem isso, `/?categoria=Maquiagem` e `/?busca=batom` contariam como páginas diferentes com o mesmo conteúdo, e o Google dividiria a relevância entre elas.

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

## Pagamento online (Mercado Pago)

Ao finalizar a compra, o pedido é salvo no Firebase e o cliente é levado ao checkout do Mercado Pago, onde paga por **Pix, cartão ou boleto**. Quando o pagamento é aprovado, o pedido vira **"pago"** sozinho e o estoque é baixado.

### Como funciona por dentro

```
Cliente finaliza  →  pedido salvo (pending)  →  checkout do Mercado Pago
                                                        ↓
              pedido vira "paid"  ←  webhook confirma  ←  cliente paga
              estoque baixado
```

Três funções de servidor, em `netlify/functions/`:

| Função | Papel |
|---|---|
| `mp-create-preference` | Cria a cobrança e devolve o link do checkout |
| `mp-webhook` | Recebe o aviso do Mercado Pago e confirma o pagamento |
| `mp-status` | Diagnóstico: mostra se está tudo configurado |

### ⚠️ Por que a volta do cliente NÃO confirma o pagamento

Quando o cliente paga, o Mercado Pago o traz de volta para `/meus-pedidos?pagamento=sucesso`. **Esse endereço é só um aviso na tela.** Ele não marca nada como pago, por dois motivos:

1. **Qualquer pessoa pode digitá-lo** no navegador. Se ele confirmasse pagamentos, bastaria colar a URL para ganhar produtos.
2. **A volta pode não acontecer.** O cliente fecha a aba, a internet cai, o Pix é pago horas depois pelo aplicativo do banco. O pedido tem que ser confirmado mesmo assim.

Quem confirma é o **webhook** — um aviso que o Mercado Pago envia ao servidor, independente do navegador do cliente.

### As duas travas do webhook

**Assinatura conferida.** Cada aviso vem com um cabeçalho `x-signature` calculado com a sua chave secreta. Se não bater, o aviso é recusado. Sem essa trava, qualquer um poderia chamar o endereço dizendo "o pedido X foi pago".

**O conteúdo do aviso é ignorado.** Mesmo com assinatura válida, não acreditamos no que o aviso diz. A função consulta o pagamento **direto na API do Mercado Pago** e decide pela resposta de lá. O aviso serve só para dizer "olhe o pagamento tal".

Além disso, o **valor é conferido**: se o pago for menor que o total do pedido, ele não vira "pago" — fica registrado um alerta para você revisar.

### Configuração

**1. Pegue as credenciais.** Mercado Pago → Suas integrações → sua aplicação → Credenciais.

**2. Configure o webhook.** Na mesma tela, em Webhooks, cadastre:
```
https://silbeauty.netlify.app/api/mp-webhook
```
Marque o evento **Pagamentos**. O Mercado Pago vai gerar uma **assinatura secreta** — copie.

**3. Pegue o segredo do Firebase.** Console → Configurações do projeto → Contas de serviço → Segredos do banco de dados.

> ⚠️ Esse segredo **ignora todas as regras do banco**. Ele existe porque o webhook precisa marcar o pedido como pago, e uma função de servidor não tem sessão de login. Nunca o coloque em variável com prefixo `VITE_`.

**4. Cadastre as três variáveis** no Netlify (Site settings → Environment variables) e no `.env` local:

```
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=...
FIREBASE_DB_SECRET=...
```

**5. Reimplante.** Variável nova não entra em deploy que já existe.

### Conferindo se ficou tudo certo

```
https://silbeauty.netlify.app/api/mp-status
```

O que você quer ver:

```json
{
  "configured": true,
  "environment": "produção",
  "tokenValid": true,
  "webhookSecretSet": true,
  "firebaseSecretSet": true,
  "ready": true
}
```

**`ready: false`** significa que o pagamento até acontece, mas o pedido **nunca é marcado como pago** — que é pior do que não funcionar, porque a venda entra sem você perceber.

### Testando antes de valer dinheiro

Use as credenciais de **teste** (o Access Token começa com `TEST-`). O código detecta pelo prefixo e usa o checkout de sandbox sozinho — não há variável separada para esquecer de trocar.

Crie um comprador de teste no painel do Mercado Pago e use os cartões de teste da documentação deles. Faça um pedido de ponta a ponta e confira:

1. O checkout abriu com o valor correto, incluindo frete
2. Depois de pagar, o pedido virou **"pago"** em `/admin` — pode levar alguns segundos
3. O **estoque baixou** na quantidade certa
4. Pagando de novo o mesmo pedido, o estoque **não baixa duas vezes**

O item 4 importa: o Mercado Pago reenvia o mesmo aviso várias vezes, e o código só age na transição de `pending` para `paid`.

### Limitações conhecidas

**A baixa de estoque não é transacional.** A API REST do Firebase não tem transação, então é um ler-calcular-gravar. Dois pagamentos aprovados no mesmo instante para o último item poderiam se atropelar. No volume de uma loja pequena o risco é baixo, e o painel mostra o estoque real.

**O total não é recalculado pelo servidor.** A função confere se o valor pago cobre o total do pedido, mas o total foi calculado pelo navegador. A defesa contra preço adulterado está nas regras do Firebase, que conferem o preço de cada item contra o catálogo.

**Estorno não reverte o estoque.** Se você estornar um pagamento, o pedido recebe o novo status mas o estoque não volta sozinho — ajuste no painel.

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
3. **Configure como variável de ambiente.** Localmente, no arquivo `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
   TELEGRAM_CHAT_ID=123456789
   ```
   Em produção, as mesmas duas em **Netlify → Site settings → Environment variables** (variável nova não entra em deploy existente — reimplante depois).
4. Pronto — a partir do próximo pedido finalizado, a mensagem chega no seu Telegram.

### ⚠️ Por que o token NÃO fica em `src/config.js`

Ele ficava, e era um problema: aquele arquivo vai inteiro para o JavaScript que o visitante baixa. **Qualquer pessoa conseguia ler o token** e usar o seu bot para mandar mensagens, ler conversas ou desligá-lo.

Mover para o `.env` com prefixo `VITE_` **não resolveria**: o Vite embute o valor no arquivo final do mesmo jeito. A única forma é o envio acontecer no servidor — por isso existe `netlify/functions/notify-order.mjs`. O site só chama `/api/notify-order` com o texto; quem conhece o token é o servidor.

Se o seu token já esteve dentro do código publicado, **gere um novo** com `/revoke` no BotFather.

⚠️ Enquanto as variáveis não forem preenchidas, o site funciona normalmente — o pedido é salvo no Firebase de qualquer forma e aparece no painel. Só o aviso não é enviado, com um registro no console. Uma falha no Telegram **nunca** derruba o fechamento da compra.

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

## Páginas de conteúdo

Além da loja, existem **Dicas de Beleza** (`/dicas-de-beleza`), **Sobre** (`/sobre`), **FAQ** (`/faq`), **Política de Privacidade** (`/politica-de-privacidade`) e **Termos de Uso** (`/termos-de-uso`), linkadas no rodapé e no menu.

⚠️ **Se você trocar de domínio**, o endereço `https://silbeauty.netlify.app/` aparece em quatro lugares e precisa ser atualizado em todos: `index.html`, `public/robots.txt`, `scripts/generate-sitemap.mjs` e `scripts/generate-og-image.mjs`. Esquecer um deles quebra o SEO em silêncio.

## Sobre as imagens dos produtos

No painel você pode colar um **link** de imagem já hospedada, ou **enviar um arquivo** — que é reduzido para 800px e salvo em base64 dentro do Realtime Database.

⚠️ **Prefira o link sempre que possível.** A vitrine lê o nó `products` inteiro, então cada foto enviada por upload (~150 KB em base64) é baixada por **todo visitante**, mesmo dos produtos que ele não abrir. Com 20 produtos isso passa de 3 MB só para exibir a página inicial.

A solução definitiva é hospedar as fotos fora do banco (Firebase Storage, Cloudinary) e guardar só a URL — o produto sairia de ~150 KB para ~100 bytes, e as imagens ganhariam cache e CDN. Ainda não está implementado.

---

<div align="center">
<sub>Feito com carinho para a <strong>SilBeauty</strong> 💗</sub>
</div>
