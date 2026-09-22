import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../utils/motion";

// Revela elementos conforme eles entram na tela.
//
// A regra de segurança aqui é o estado PADRÃO ser visível: a classe que
// esconde só é aplicada quando sabemos que há como revelar (navegador com
// IntersectionObserver e movimento permitido). Se qualquer coisa falhar, o
// conteúdo aparece normalmente em vez de ficar invisível para sempre.
export function useRevealOnScroll() {
  const containerRef = useRef(null);
  const [enabled] = useState(
    () => !prefersReducedMotion() && typeof IntersectionObserver !== "undefined"
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const root = containerRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          // Uma vez revelado, para de observar: reanimar a cada rolagem
          // para cima e para baixo cansa a vista.
          observer.unobserve(entry.target);
        });
      },
      // A margem negativa embaixo faz a animação começar um pouco antes de
      // o elemento encostar na borda, o que parece mais natural.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    root.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);

  return { containerRef, revealEnabled: enabled };
}

// Marca qual seção está sendo lida, para destacar o atalho correspondente.
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] || "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pode haver várias seções visíveis ao mesmo tempo; a que vale é a
        // que está mais acima na tela.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible) setActive(visible.target.id);
      },
      // A faixa estreita no topo evita que o destaque fique pulando entre
      // duas seções quando as duas estão na tela.
      { rootMargin: "-15% 0px -75% 0px" }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return active;
}
