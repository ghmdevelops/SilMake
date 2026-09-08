# SilMake

E-commerce simples feito em React (Vite) que se conecta direto ao Firebase Realtime Database. Permite cadastrar produtos (com imagem por link ou upload), exibi-los na vitrine e usar um carrinho de compras simples.

## Estrutura

```
client/          -> aplicação React (Vite)
  src/
    firebase.js          -> configuração do Firebase (já preenchida)
    hooks/useProducts.js  -> leitura em tempo real dos produtos
    api/products.js       -> criar / editar / excluir produtos
    context/CartContext.jsx -> estado do carrinho (persistido no localStorage)
    components/           -> Navbar, Footer, ProductCard
    pages/
      Home.jsx        -> vitrine de produtos (busca + filtro por categoria)
      ProductDetail.jsx -> página do produto
      Cart.jsx         -> carrinho de compras
      Admin.jsx        -> painel para cadastrar/editar/excluir produtos (sem login)
```

## Rodando o projeto

```bash
cd client
npm install
npm run dev
```

Acesse http://localhost:5173 (ou a porta indicada no terminal).

## Protegendo o painel Admin

O link "Admin" **não aparece** no menu do site — só quem souber a URL `/admin` chega até a tela de login. Além disso, a página pede uma senha antes de liberar o acesso.

1. Localmente, crie um arquivo `client/.env` (não é versionado no Git) com:
   ```
   VITE_ADMIN_PASSWORD=sua-senha-aqui
   ```
   Um exemplo está em `client/.env.example`.

2. **No Netlify**, ao publicar o site, vá em *Site settings → Environment variables* e adicione a mesma variável:
   - Key: `VITE_ADMIN_PASSWORD`
   - Value: sua senha escolhida

   Sem essa variável configurada, a página `/admin` mostra um aviso dizendo que o acesso não foi configurado, ao invés de abrir o painel.

⚠️ Isso é uma proteção simples (senha fixa no front-end), suficiente para impedir acesso casual, mas não é uma autenticação robusta — alguém com bastante conhecimento técnico ainda poderia inspecionar o código do site e descobrir a senha, já que tudo roda no navegador sem backend. Para uma proteção mais forte, o próximo passo seria usar Firebase Authentication (login de verdade) combinado com regras do banco que exigem usuário autenticado.

## Login, cadastro e painel Admin (Firebase Authentication)

O site agora tem login de verdade:
- **Clientes**: podem criar conta (e-mail/senha ou Google) em `/cadastro`, entrar em `/login`, recuperar senha em `/esqueci-senha`, e editar nome/sobrenome/endereço de entrega em `/perfil`.
- **Checkout**: ao clicar em "Finalizar compra", o cliente precisa estar logado e ter um endereço salvo no perfil — só então é redirecionado ao WhatsApp (já com a lista de produtos, total e endereço preenchidos).
- **Histórico de pedidos**: cada pedido finalizado fica salvo no perfil do cliente (`/perfil`), marcado como "Fechado".
- **Admin**: o acesso ao `/admin` agora depende de login com uma conta cujo e-mail esteja na lista `ADMIN_EMAILS` em `client/src/config.js` (hoje configurado com `gehaime43@gmail.com`).
- **Manter conectado**: na tela de login, o cliente pode marcar "Manter conectado" (sessão permanece mesmo fechando o navegador) ou deixar desmarcado (sai automaticamente ao fechar a aba). a

### ⚠️ Passo obrigatório no Firebase Console

1. **Ativar os métodos de login**: vá em *Authentication → Sign-in method* e habilite **"E-mail/senha"** e **"Google"**. Sem isso, login/cadastro não funcionam.
2. **Criar a conta de admin**: acesse `/cadastro` no site com o e-mail `gehaime43@gmail.com` (o mesmo que está em `ADMIN_EMAILS`) para criar sua conta de administrador.
3. **Atualizar as regras do Realtime Database** (Realtime Database → Regras), substituindo a regra pública antiga por:

```json
{
  "rules": {
    "products": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'gehaime43@gmail.com'"
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "orders": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

Essa regra é bem mais segura que a anterior (que era `".read": true, ".write": true` para todo o banco):
- **Produtos**: todo mundo pode *ler* (para a loja funcionar), mas só a conta admin pode *escrever* (criar/editar/excluir).
- **Perfil e pedidos** (`users`, `orders`): cada cliente só pode ler/escrever os **seus próprios** dados — nunca os de outro cliente.

⚠️ Se você adicionar mais e-mails em `ADMIN_EMAILS` no futuro, lembre-se de atualizar também o e-mail (ou lista de e-mails) nessa regra do Firebase — eles não se sincronizam automaticamente, já que a regra vive no console do Firebase, fora do código do site.

## Deploy no Netlify

O arquivo `netlify.toml` (na raiz do repositório) já está configurado com:
- `base = "client"` — a pasta do projeto React
- `command = "npm run build"` — comando de build
- `publish = "dist"` — pasta gerada pelo build
- Um redirect de todas as rotas para `index.html`, necessário para o React Router funcionar (ex: acessar `/produto/xyz` direto pela URL)

Passos para publicar:
1. Suba o repositório para o GitHub/GitLab.
2. No Netlify, crie um novo site "Import from Git" apontando para esse repositório (o `netlify.toml` já configura tudo automaticamente).
3. Antes do primeiro deploy (ou depois, e faça um novo deploy), vá em *Site settings → Environment variables* e adicione `VITE_ADMIN_PASSWORD` com a senha do painel admin.

## WhatsApp

O número de WhatsApp da loja está configurado em `client/src/config.js`:

```js
export const WHATSAPP_NUMBER = "5511981835197";
```

Ele é usado em dois lugares:
- **Botão flutuante** (canto inferior esquerdo, em todas as páginas) — abre uma conversa com mensagem inicial.
- **Finalizar compra** no carrinho — ao clicar, abre o WhatsApp automaticamente já com a lista de produtos escolhidos, quantidades e o valor total do pedido preenchidos na mensagem, pronta para o cliente enviar.

Se precisar trocar o número no futuro, basta editar esse arquivo.

## Favoritos

Os usuários podem clicar no coração (♡) de qualquer produto para salvá-lo como favorito. A lista fica salva no navegador (localStorage) e pode ser vista em `/favoritos`, com contador no menu.

## PWA (app instalável)

O site agora é um PWA completo (via `vite-plugin-pwa`):
- **Instalável**: no Chrome/Edge (desktop e Android), aparece um prompt customizado convidando a instalar o app na tela inicial. No iOS/Safari, o usuário pode usar "Adicionar à Tela de Início" pelo menu de compartilhar.
- **Ícones**: gerados em `client/public/` (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`) a partir do logo da marca. Se quiser regenerar (por exemplo, depois de mudar o `favicon.svg`), rode:
  ```bash
  cd client
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

⚠️ **Importante**: os arquivos `index.html`, `robots.txt` e `sitemap.xml` usam a URL de exemplo `https://silmake.netlify.app/`. Depois que você publicar e souber o endereço final do site (o domínio que o Netlify gerar, ou um domínio próprio), troque essa URL nesses três arquivos para o SEO funcionar corretamente.

## Sobre as imagens

No painel Admin você pode:
- Colar um **link (URL)** de uma imagem já hospedada em algum lugar; ou
- Fazer **upload de um arquivo** do computador — a imagem é convertida em base64 e salva direto no Realtime Database.

Upload de arquivo é prático, mas gera registros maiores no banco. Para uma loja com muitas fotos em alta resolução, o ideal futuramente é usar o Firebase Storage.
