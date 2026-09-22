import { Link } from "react-router-dom";
import { openCookiePreferences } from "../utils/cookiePreferences";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col footer-brand-col">
            <Link to="/" className="footer-brand">
              Sil<span>Beauty</span>
            </Link>
            <p>Beleza e cuidado em cada produto, com todo o carinho da SilBeauty.</p>
          </div>

          <div className="footer-col">
            <h4>Loja</h4>
            <Link to="/">Vitrine</Link>
            <Link to="/carrinho">Carrinho</Link>
            <Link to="/dicas-de-beleza">Dicas de beleza</Link>
            <Link to="/sobre">Sobre nós</Link>
          </div>

          <div className="footer-col">
            <h4>Ajuda</h4>
            <Link to="/faq">Perguntas frequentes</Link>
            <a href="mailto:contato@silbeauty.com">Fale conosco</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/politica-de-privacidade">Política de Privacidade</Link>
            <Link to="/termos-de-uso">Termos de Uso</Link>
            {/* Consentimento precisa ser revogável: daqui o cliente reabre o
                aviso e muda a escolha a qualquer momento. */}
            <button type="button" className="footer-link-btn" onClick={openCookiePreferences}>
              Preferências de cookies
            </button>
          </div>
        </div>

        <p className="footer-year">© {new Date().getFullYear()} SilBeauty. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
