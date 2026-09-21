import { useSeo } from "../hooks/useSeo";
import "./StaticPage.css";

export default function PrivacyPolicy() {
  useSeo({
    title: "Política de Privacidade",
    description:
      "Saiba como a SilBeauty coleta, usa e protege seus dados pessoais ao navegar e comprar em nossa loja.",
  });

  return (
    <div className="static-page">
      <h1>Política de Privacidade</h1>
      <p className="static-page-subtitle">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <p>
        A sua privacidade é importante para nós. Esta página explica de forma simples quais
        informações a SilBeauty coleta, como usamos esses dados e quais são os seus direitos.
      </p>

      <h2>1. Quais dados coletamos</h2>
      <ul>
        <li>Itens adicionados ao carrinho (armazenados localmente no seu navegador).</li>
        <li>Preferência de aceite de cookies.</li>
        <li>Dados de navegação básicos, como páginas visitadas, para melhorar a experiência da loja.</li>
      </ul>

      <h2>2. Como usamos seus dados</h2>
      <p>
        Usamos essas informações apenas para o funcionamento da loja — por exemplo, lembrar os
        produtos do seu carrinho entre visitas — e para entender como melhorar o site. Não
        vendemos ou compartilhamos seus dados com terceiros para fins de marketing.
      </p>

      <h2>3. Cookies</h2>
      <p>
        Utilizamos cookies e armazenamento local (localStorage) para lembrar suas preferências,
        como o conteúdo do carrinho e o consentimento de cookies. Você pode limpar esses dados a
        qualquer momento nas configurações do seu navegador.
      </p>

      <h2>4. Seus direitos</h2>
      <p>
        Você pode solicitar a exclusão dos seus dados armazenados localmente limpando o cache e
        os dados de navegação do seu navegador para este site. Para dúvidas adicionais, entre em
        contato conosco.
      </p>

      <h2>5. Contato</h2>
      <p>
        Em caso de dúvidas sobre esta política, entre em contato pelo e-mail{" "}
        <a href="mailto:contato@silbeauty.com">contato@silbeauty.com</a>.
      </p>
    </div>
  );
}
