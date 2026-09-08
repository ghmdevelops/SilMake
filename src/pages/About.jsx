import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";
import "./StaticPage.css";

export default function About() {
  useSeo({
    title: "Sobre nós",
    description:
      "Conheça a história da SilMake, uma loja online dedicada a produtos artesanais feitos com carinho.",
  });

  return (
    <div className="static-page">
      <h1>
        Sobre a Sil<span style={{ color: "var(--accent-1)" }}>Make</span>
      </h1>
      <p className="static-page-subtitle">Produtos feitos com carinho, anunciados com estilo.</p>

      <p>
        A SilMake nasceu da vontade de transformar trabalho manual e dedicação em produtos que
        encantam. Cada item da nossa loja é pensado nos mínimos detalhes, com muito carinho na
        confecção e no acabamento.
      </p>

      <p>
        Acreditamos que comprar artesanal é valorizar tempo, história e cuidado — por isso
        buscamos oferecer uma vitrine simples, bonita e transparente para você conhecer nossos
        produtos.
      </p>

      <div className="about-grid">
        <div className="about-stat">
          <strong>100%</strong>
          <span>Feito à mão</span>
        </div>
        <div className="about-stat">
          <strong>+1</strong>
          <span>Ano de dedicação</span>
        </div>
        <div className="about-stat">
          <strong>♥</strong>
          <span>Muito carinho</span>
        </div>
      </div>

      <h2>Quer saber mais?</h2>
      <p>
        Veja nossas <Link to="/">novidades na loja</Link>, tire suas dúvidas no{" "}
        <Link to="/faq">FAQ</Link> ou fale diretamente conosco.
      </p>
    </div>
  );
}
