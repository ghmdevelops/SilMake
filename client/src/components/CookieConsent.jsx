import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CookieConsent.css";

const STORAGE_KEY = "silmake_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Aviso de cookies">
      <div className="cookie-consent-box">
        <span className="cookie-icon">🍪</span>
        <div className="cookie-text">
          <strong>Nós usamos cookies</strong>
          <p>
            Usamos cookies para melhorar sua experiência na SilMake, lembrar o
            seu carrinho e entender como você usa a loja. Ao continuar
            navegando, você concorda com o uso de cookies. Saiba mais na nossa{" "}
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
