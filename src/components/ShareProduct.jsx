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
export default function ShareProduct({ product, compact = false }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const buttonRef = useRef(null);

  // Fecha ao clicar fora ou apertar Esc — comportamento esperado de menu.
  useEffect(() => {
    if (!open) return undefined;

    function handlePointer(e) {
      if (!buttonRef.current?.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
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
        onClick={() => setOpen((v) => !v)}
        aria-label="Compartilhar produto"
        aria-expanded={open}
        disabled={generating}
      >
        <Share size={compact ? 16 : 18} />
        {!compact && <span>{generating ? "Gerando..." : "Compartilhar"}</span>}
      </button>

      {open && (
        <div className="share-menu" role="menu">
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
        </div>
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
