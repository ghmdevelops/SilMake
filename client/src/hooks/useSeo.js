import { useEffect } from "react";

const SITE_NAME = "SilMake";

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

// Define título da aba e meta description de cada página, importante para SEO.
export function useSeo({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Sua Loja Online`;
    document.title = fullTitle;

    if (description) {
      setMetaTag("description", description);
      setMetaTag("og:description", description, "property");
    }

    setMetaTag("og:title", fullTitle, "property");
  }, [title, description]);
}
