import { useEffect } from "react";

const SITE_NAME = "SilBeauty";

function setMetaTag(name, content, attr = "name") {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

// Remove parâmetros de busca do endereço canônico. Sem isso, /?categoria=X e
// /?busca=Y contariam como páginas diferentes com o mesmo conteúdo, e o
// Google dividiria a relevância entre elas.
function canonicalUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

// Define título, descrição e dados de compartilhamento de cada página.
//
// `image` deve ser uma URL absoluta. `type` vira "product" na página de um
// produto, o que dá ao Facebook e ao WhatsApp o contexto de item à venda.
export function useSeo({ title, description, image, type = "website" }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Sua Loja Online`;
    document.title = fullTitle;

    if (description) {
      setMetaTag("description", description);
      setMetaTag("og:description", description, "property");
      setMetaTag("twitter:description", description);
    }

    setMetaTag("og:title", fullTitle, "property");
    setMetaTag("twitter:title", fullTitle);
    setMetaTag("og:type", type, "property");

    const url = canonicalUrl();
    setCanonical(url);
    setMetaTag("og:url", url, "property");

    if (image) {
      setMetaTag("og:image", image, "property");
      setMetaTag("twitter:image", image);
    }
  }, [title, description, image, type]);
}
