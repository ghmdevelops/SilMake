import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/analytics";

// Duas responsabilidades ligadas à troca de rota:
//
// 1. O React Router não reposiciona a página ao navegar: quem clicava num
//    produto no meio da vitrine abria a página dele já rolada para baixo.
// 2. Numa aplicação de página única o navegador não dispara "nova página",
//    então a medição precisa ser avisada manualmente a cada navegação.
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // "instant" evita a animação de rolagem, que numa troca de página parece
    // um glitch em vez de um movimento intencional.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    trackPageView(`${pathname}${search}`);
  }, [pathname, search]);

  return null;
}
