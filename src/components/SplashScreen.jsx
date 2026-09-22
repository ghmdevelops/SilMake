import { useEffect, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { prefersReducedMotion } from "../utils/motion";
import "./SplashScreen.css";

// Tempo MÁXIMO de espera. Se o Firebase demorar ou não responder (rede ruim,
// bloqueio de firewall), a loja abre assim mesmo. Prender o cliente numa tela
// de logo é pior do que mostrar a vitrine ainda vazia — que pelo menos já tem
// menu, busca e navegação.
const MAX_WAIT_MS = 3000;

// Tempo MÍNIMO na tela. Precisa cobrir a entrada das letras, senão a
// animação é cortada no meio e fica pior do que não ter animação nenhuma.
const MIN_SHOW_MS = 850;

const FADE_MS = 420;

const BRAND = "SilBeauty";
// A partir daqui as letras são rosa: "Sil" escuro + "Beauty" em destaque,
// igual à marca do menu.
const ACCENT_FROM = 3;

// Tela de abertura, exibida enquanto o catálogo carrega.
// Fica montada uma única vez no App, então não reaparece a cada navegação —
// só num recarregamento de página, que é o esperado de um splash.
export default function SplashScreen() {
  const { loading } = useProducts();
  const [phase, setPhase] = useState("visible"); // visible | leaving | gone
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (phase !== "visible") return undefined;

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_SHOW_MS - elapsed);

    // Sai quando os produtos chegam...
    const doneTimer = loading ? null : setTimeout(() => setPhase("leaving"), remaining);
    // ...ou quando estoura o tempo máximo, o que acontecer primeiro.
    const maxTimer = setTimeout(
      () => setPhase("leaving"),
      Math.max(remaining, MAX_WAIT_MS - elapsed)
    );

    return () => {
      if (doneTimer) clearTimeout(doneTimer);
      clearTimeout(maxTimer);
    };
  }, [loading, phase, startedAt]);

  // Espera a transição terminar antes de remover do DOM, senão a tela sumiria
  // de uma vez em vez de desaparecer suavemente.
  useEffect(() => {
    if (phase !== "leaving") return undefined;
    const timer = setTimeout(() => setPhase("gone"), prefersReducedMotion() ? 0 : FADE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      className={`splash ${phase === "leaving" ? "is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Carregando a loja"
    >
      {/* Manchas de cor que derivam devagar ao fundo. Substituem uma imagem:
          carregam instantâneo e nunca ficam pixeladas. */}
      <span className="splash-blob blob-a" aria-hidden="true" />
      <span className="splash-blob blob-b" aria-hidden="true" />

      <div className="splash-stage">
        {/* As letras são divididas para entrarem uma após a outra. O leitor
            de tela recebe o nome inteiro pelo aria-label acima, por isso as
            letras ficam escondidas dele — senão soletraria "S, i, l...". */}
        <div className="splash-logo" aria-hidden="true">
          {BRAND.split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className={index >= ACCENT_FROM ? "accent" : ""}
              style={{ "--i": index }}
            >
              {letter}
            </span>
          ))}
        </div>

        <span className="splash-tagline" aria-hidden="true">
          beleza e cuidado
        </span>

        <span className="splash-bar" aria-hidden="true">
          <span />
        </span>
      </div>
    </div>
  );
}
