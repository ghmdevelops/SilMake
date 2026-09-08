import { useSeo } from "../hooks/useSeo";
import "./StaticPage.css";

export default function Terms() {
  useSeo({
    title: "Termos de Uso",
    description: "Confira os termos e condições de uso da loja SilMake.",
  });

  return (
    <div className="static-page">
      <h1>Termos de Uso</h1>
      <p className="static-page-subtitle">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <p>
        Ao acessar e usar o site da SilMake, você concorda com os termos descritos abaixo. Leia
        com atenção antes de realizar uma compra.
      </p>

      <h2>1. Sobre a loja</h2>
      <p>
        A SilMake é uma loja online de produtos artesanais e feitos com carinho. As informações
        de produtos (fotos, descrições e preços) são de responsabilidade da loja e podem ser
        atualizadas a qualquer momento.
      </p>

      <h2>2. Pedidos e pagamentos</h2>
      <p>
        No momento, o carrinho de compras é apenas demonstrativo e não processa pagamentos reais.
        Para finalizar uma compra de verdade, entre em contato diretamente com a loja pelos
        canais informados no rodapé do site.
      </p>

      <h2>3. Uso do site</h2>
      <ul>
        <li>Não é permitido usar o site para fins ilegais ou não autorizados.</li>
        <li>As imagens e textos do site são de propriedade da SilMake e não devem ser copiados sem autorização.</li>
      </ul>

      <h2>4. Alterações</h2>
      <p>
        Estes termos podem ser atualizados periodicamente. Recomendamos revisar esta página de
        tempos em tempos.
      </p>

      <h2>5. Contato</h2>
      <p>
        Dúvidas sobre estes termos? Fale com a gente em{" "}
        <a href="mailto:contato@silmake.com">contato@silmake.com</a>.
      </p>
    </div>
  );
}
