import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../utils/motion";
import "./BackToTop.css";

// Aparece depois que o cliente desce a página. Numa vitrine com muitos
// produtos, voltar ao menu (que é onde estão carrinho e busca) exigia rolar
// tudo de novo — especialmente no celular.
const SHOW_AFTER = 700;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER);
    }

    onScroll();
    // passive: não precisamos bloquear a rolagem, então o navegador pode
    // otimizar o scroll.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion() ? "instant" : "smooth",
        })
      }
      aria-label="Voltar ao topo da página"
    >
      ↑
    </button>
  );
}
