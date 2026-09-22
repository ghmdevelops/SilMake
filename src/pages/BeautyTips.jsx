import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";
import { useRevealOnScroll, useActiveSection } from "../hooks/useRevealOnScroll";
import { BEAUTY_TIPS } from "../data/beautyTips";
import {
  Droplet,
  Feather,
  Eye,
  Smile,
  Paintbrush,
  Timer,
  AlertTriangle,
  Wind,
  Gem,
  Scissors,
  Archive,
} from "../components/icons";
import "./StaticPage.css";
import "./BeautyTips.css";

// Um ícone por seção. Fica fora do array de conteúdo porque componente não é
// dado — misturar os dois dificultaria migrar o texto para o banco depois.
const ICONS = {
  pele: Droplet,
  sobrancelhas: Feather,
  olhos: Eye,
  labios: Smile,
  maquiagem: Paintbrush,
  rotina: Timer,
  erros: AlertTriangle,
  perfume: Wind,
  unhas: Gem,
  cabelos: Scissors,
  conservacao: Archive,
};

// O texto das dicas vive em src/data/beautyTips.js — aqui fica só a tela.
const SECTIONS = BEAUTY_TIPS;

const SECTION_IDS = SECTIONS.map((section) => section.id);

export default function BeautyTips() {
  useSeo({
    title: "Dicas de Beleza",
    description:
      "Dicas práticas de skincare, maquiagem, perfumaria e conservação de cosméticos — por SilBeauty.",
  });

  const { containerRef, revealEnabled } = useRevealOnScroll();
  const activeSection = useActiveSection(SECTION_IDS);

  return (
    <div className="static-page tips-page" ref={containerRef}>
      <h1>Dicas de Beleza</h1>
      <p className="static-page-subtitle">
        Coisas simples que fazem diferença de verdade no resultado.
      </p>

      {/* Atalhos: a página é longa, e no celular rolar até a seção certa
          seria cansativo. O destaque acompanha o que está sendo lido. */}
      <nav className="tips-nav" aria-label="Ir para uma seção">
        {SECTIONS.map((section) => {
          const Icon = ICONS[section.id];
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`tips-nav-link ${activeSection === section.id ? "active" : ""}`}
              aria-current={activeSection === section.id ? "true" : undefined}
            >
              {Icon && <Icon size={14} />}
              {section.title}
            </a>
          );
        })}
      </nav>

      {SECTIONS.map((section) => {
        const Icon = ICONS[section.id];
        return (
          <section key={section.id} id={section.id} className="tips-section">
            <h2 className="tips-section-title">
              {Icon && (
                <span className="tips-section-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
              )}
              {section.title}
            </h2>
            <p className="tips-intro">{section.intro}</p>

            <div className="tips-grid">
              {section.tips.map((tip, index) => (
                <article
                  key={tip.title}
                  className={`tip-card ${revealEnabled ? "reveal" : ""}`}
                  data-reveal=""
                  // Escalona a entrada dos cards da mesma linha. Sem isso os
                  // quatro apareceriam juntos, o que parece um salto em vez
                  // de um movimento.
                  style={{ "--reveal-delay": `${index * 70}ms` }}
                >
                  <span className="tip-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{tip.title}</h3>
                  <p>{tip.text}</p>
                </article>
              ))}
            </div>

            {section.categoria && (
              <Link
                className="tips-cta"
                to={`/?categoria=${encodeURIComponent(section.categoria)}`}
              >
                Ver produtos de {section.categoria.toLowerCase()}
                <span className="tips-cta-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            )}
          </section>
        );
      })}

      <p className="tips-disclaimer">
        As dicas acima são orientações gerais de cuidado e não substituem a avaliação de um
        dermatologista. Em caso de alergia, irritação ou dúvida sobre um ativo específico, procure
        um profissional.
      </p>
    </div>
  );
}
