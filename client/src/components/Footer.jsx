import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col footer-brand-col">
            <Link to="/" className="footer-brand">
              Sil<span>Make</span>
            </Link>
            <p>Produtos feitos com carinho, anunciados com estilo.</p>
          </div>

          <div className="footer-col">
            <h4>Loja</h4>
            <Link to="/">Vitrine</Link>
            <Link to="/carrinho">Carrinho</Link>
            <Link to="/sobre">Sobre nós</Link>
          </div>

          <div className="footer-col">
            <h4>Ajuda</h4>
            <Link to="/faq">Perguntas frequentes</Link>
            <a href="mailto:contato@silmake.com">Fale conosco</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/politica-de-privacidade">Política de Privacidade</Link>
            <Link to="/termos-de-uso">Termos de Uso</Link>
          </div>
        </div>

        <p className="footer-year">© {new Date().getFullYear()} SilMake. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
