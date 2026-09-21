import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { initAnalytics, disableAnalytics } from "../utils/analytics";
import { COOKIE_PREFERENCES_EVENT } from "../utils/cookiePreferences";
import "./CookieConsent.css";

const STORAGE_KEY = "silbeauty_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);

    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }

    // Quem já aceitou antes continua medido; quem recusou permanece de fora.
    if (consent === "accepted") initAnalytics();
    else disableAnalytics();
  }, []);

  // Reabre o aviso quando o cliente clica em "Cookies" no rodapé.
  useEffect(() => {
    function reopen() {
      setVisible(true);
    }
    window.addEventListener(COOKIE_PREFERENCES_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, reopen);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
    // Só aqui a medição começa — antes disso nada é carregado.
    initAnalytics();
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
    disableAnalytics();
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Aviso de cookies">
      <div className="cookie-consent-box">
        <span className="cookie-icon">🍪</span>
        <div className="cookie-text">
          <strong>Sua privacidade</strong>
          <p>
            Guardamos no seu navegador o que é necessário para a loja funcionar —
            seu carrinho, favoritos e login. Isso não depende da sua escolha aqui.
          </p>
          <p>
            Já os cookies de <strong>medição</strong>, que nos ajudam a entender
            quais produtos interessam, só são ativados se você aceitar. Detalhes na{" "}
            <Link to="/politica-de-privacidade">Política de Privacidade</Link>.
          </p>
        </div>
        <div className="cookie-actions">
          <button className="btn btn-ghost" onClick={decline}>
            Recusar
          </button>
          <button className="btn btn-primary" onClick={accept}>
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
