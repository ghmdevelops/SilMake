import { useEffect, useMemo, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { prefersReducedMotion } from "../utils/motion";
import "./SplashScreen.css";

// Tempo MÁXIMO de espera. Se o Firebase demorar, a rede estiver ruim ou uma
// foto travar, a loja abre assim mesmo. Prender a cliente numa tela de logo é
// pior do que mostrar a vitrine com uma imagem ainda chegando — este teto
// existe justamente para a espera pelas fotos não virar uma armadilha.
const MAX_WAIT_MS = 3000;

// Tempo MÍNIMO na tela. Precisa cobrir a entrada do logo, senão a animação é
// cortada no meio e fica pior do que não ter animação nenhuma.
const MIN_SHOW_MS = 850;

const FADE_MS = 420;

// Tela de abertura, exibida enquanto o catálogo carrega.
// Fica montada uma única vez no App, então não reaparece a cada navegação —
// só num recarregamento de página, que é o esperado de um splash.
export default function SplashScreen() {
  const { products, loading } = useProducts();
  const [phase, setPhase] = useState("visible"); // visible | leaving | gone
  const [startedAt] = useState(() => Date.now());
  const [carregadas, setCarregadas] = useState(0);

  // Fotos que aparecem sem rolar a página. Esperar o catálogo inteiro
  // seguraria a loja por causa de imagens que ninguém está olhando ainda.
  const primeirasFotos = useMemo(
    () => (loading ? [] : products.slice(0, 6).map((p) => p.image).filter(Boolean)),
    [loading, products]
  );

  // Espera as fotos ficarem prontas, não só os dados chegarem.
  //
  // Sem isto, o splash saía assim que o Firebase respondia — e a cliente via
  // a vitrine montada com buracos, as imagens aparecendo uma a uma. O
  // carregamento ficava visível justamente no primeiro instante.
  useEffect(() => {
    if (primeirasFotos.length === 0) return undefined;

    let cancelado = false;
    // Erro conta como carregada: uma foto quebrada não pode segurar a loja.
    const contar = () => {
      if (!cancelado) setCarregadas((n) => n + 1);
    };

    for (const url of primeirasFotos) {
      const img = new Image();
      img.onload = contar;
      img.onerror = contar;
      img.src = url;
    }

    return () => {
      cancelado = true;
    };
  }, [primeirasFotos]);

  // Derivado em vez de guardado em estado: um setState síncrono dentro do
  // efeito dispararia uma renderização em cascata.
  const fotosProntas = carregadas >= primeirasFotos.length;
  const pronto = !loading && fotosProntas;

  useEffect(() => {
    if (phase !== "visible") return undefined;

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_SHOW_MS - elapsed);

    // Sai quando os produtos e as primeiras fotos estão prontos...
    const doneTimer = !pronto ? null : setTimeout(() => setPhase("leaving"), remaining);
    // ...ou quando estoura o tempo máximo, o que acontecer primeiro.
    const maxTimer = setTimeout(
      () => setPhase("leaving"),
      Math.max(remaining, MAX_WAIT_MS - elapsed)
    );

    return () => {
      if (doneTimer) clearTimeout(doneTimer);
      clearTimeout(maxTimer);
    };
  }, [pronto, phase, startedAt]);

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
        {/* O logo já contém a palavra "SilBeauty", por isso vem como imagem
            decorativa: o nome da loja é anunciado pelo aria-label do bloco
            acima, sem repetição para quem usa leitor de tela. */}
        <img
          className="splash-logo"
          src="/logo.png"
          alt=""
          aria-hidden="true"
          width="328"
          height="272"
          // O splash aparece no primeiro instante da página: esperar o
          // carregamento preguiçoso aqui mostraria um vazio justamente onde
          // a marca deveria estar.
          fetchPriority="high"
        />

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
