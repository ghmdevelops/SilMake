import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../context/ToastContext";
import { buildStoryImage } from "../utils/storyImage";
import { Share, Link as LinkIcon, Instagram } from "./icons";
import "./ShareProduct.css";

function productUrl(productId) {
  return `${window.location.origin}/produto/${productId}`;
}

// Botão de compartilhar com três saídas: copiar o link, abrir o menu nativo
// do celular, ou baixar a arte pronta para Stories.
//
// `compact` é a versão do card da vitrine (só o ícone); sem ele vem o botão
// com texto, usado na página do produto.
// Largura do menu, usada para mantê-lo dentro da tela.
const MENU_WIDTH = 200;

export default function ShareProduct({ product, compact = false }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  // Posição calculada a partir do botão. Necessária porque o menu é
  // renderizado no <body>, fora da árvore do card.
  const [menuPos, setMenuPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // O menu vive num portal no <body>, e não dentro do card.
  //
  // Motivo: o card tem overflow:hidden para arredondar a foto, o que recorta
  // qualquer coisa que passe das suas bordas. Dentro do card, o menu aparecia
  // cortado no celular — sem os ícones e sem a última opção.
  function abrirMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const margem = 8;
    // Alinha pela direita do botão, mas nunca deixa sair da tela.
    const left = Math.min(
      Math.max(margem, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - margem
    );

    setMenuPos({ top: rect.bottom + 8, left });
    setOpen(true);
  }

  // Fecha ao clicar fora ou apertar Esc — comportamento esperado de menu.
  useEffect(() => {
    if (!open) return undefined;

    function handlePointer(e) {
      // Precisa checar o menu também: ele não está mais dentro do botão na
      // árvore do DOM, então contains() do botão não o cobre mais.
      if (buttonRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    // Rolar com o menu aberto o deixaria deslocado do botão, já que a
    // posição é fixa na tela.
    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const url = productUrl(product.id);

  async function handleCopy() {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copiado!", { type: "success" });
    } catch {
      showToast("Não foi possível copiar o link.", { type: "error" });
    }
  }

  async function handleNativeShare() {
    setOpen(false);
    try {
      await navigator.share({
        title: product.name,
        text: `Olha esse produto na SilBeauty: ${product.name}`,
        url,
      });
    } catch {
      // Cancelar o compartilhamento cai aqui e não é erro.
    }
  }

  async function handleStory() {
    setOpen(false);
    setGenerating(true);
    try {
      const blob = await buildStoryImage(product, { siteUrl: window.location.origin });
      if (!blob) throw new Error("sem imagem");

      const file = new File([blob], `silbeauty-${product.id}.jpg`, { type: "image/jpeg" });

      // No celular, compartilhar o arquivo direto abre o Instagram na lista.
      // canShare com arquivos não existe em todo navegador, por isso o teste.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: product.name });
        return;
      }

      // No computador, baixa o arquivo para você subir depois.
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
      showToast("Imagem baixada! É só postar nos Stories.", { type: "success" });
    } catch (err) {
      // AbortError = a pessoa fechou o menu de compartilhamento.
      if (err?.name !== "AbortError") {
        console.error("Falha ao gerar a arte:", err);
        showToast("Não foi possível gerar a imagem.", { type: "error" });
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="share-product" ref={buttonRef}>
      <button
        type="button"
        className={compact ? "share-trigger-compact" : "btn btn-ghost share-trigger"}
        onClick={() => (open ? setOpen(false) : abrirMenu())}
        aria-label="Compartilhar produto"
        aria-expanded={open}
        disabled={generating}
      >
        <Share size={compact ? 16 : 18} />
        {!compact && <span>{generating ? "Gerando..." : "Compartilhar"}</span>}
      </button>

      {open &&
        menuPos &&
        createPortal(
          <div
            className="share-menu"
            role="menu"
            ref={menuRef}
            style={{ top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
          >
            <button type="button" role="menuitem" onClick={handleCopy}>
              <LinkIcon size={16} /> Copiar link
            </button>

            {/* Só aparece onde existe: no computador, quase nunca. */}
            {typeof navigator !== "undefined" && navigator.share && (
              <button type="button" role="menuitem" onClick={handleNativeShare}>
                <Share size={16} /> Enviar link
              </button>
            )}

            <button type="button" role="menuitem" onClick={handleStory}>
              <Instagram size={16} /> Arte para Stories
            </button>
          </div>,
          document.body
        )}

      {/* Aviso de progresso: gerar a arte leva um instante, e sem retorno
          visual parece que o clique não funcionou. */}
      {generating &&
        createPortal(
          <div className="share-generating" role="status">
            <span className="share-spinner" aria-hidden="true" />
            Montando a arte...
          </div>,
          document.body
        )}
    </div>
  );
}
