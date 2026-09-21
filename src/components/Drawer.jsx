import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Drawer.css";

// Painel lateral reutilizável (carrinho e favoritos). Mantém o cliente na
// página em que está, em vez de tirá-lo da vitrine.
export default function Drawer({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }

    // Travar a rolagem do fundo evita o efeito de "duas páginas rolando".
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Renderizado direto no <body> (portal): a navbar usa backdrop-filter, e
  // isso faz dela o bloco de referência dos filhos "position: fixed" — o
  // painel ficaria recortado dentro da altura do menu.
  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="drawer-header">
          <h2>{title}</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="drawer-body">{children}</div>

        {footer && <footer className="drawer-footer">{footer}</footer>}
      </aside>
    </div>,
    document.body
  );
}
