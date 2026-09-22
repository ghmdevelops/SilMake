import { Link } from "react-router-dom";
import { BEAUTY_TIPS } from "../data/beautyTips";
import { Droplet, Paintbrush, Eye, Wind, Sparkles } from "./icons";
import "./TipsBanner.css";

// O número vem do próprio conteúdo. Se você acrescentar ou remover dicas,
// a chamada continua verdadeira sozinha — número de propaganda que não bate
// com a realidade é a forma mais rápida de perder confiança.
const TOTAL_TIPS = BEAUTY_TIPS.reduce((sum, section) => sum + section.tips.length, 0);

// Ícones que compõem a ilustração. São os mesmos das seções da página de
// dicas, o que cria ligação visual entre o anúncio e o destino.
const FLOATING = [
  { Icon: Droplet, className: "tips-banner-orb orb-1" },
  { Icon: Paintbrush, className: "tips-banner-orb orb-2" },
  { Icon: Eye, className: "tips-banner-orb orb-3" },
  { Icon: Wind, className: "tips-banner-orb orb-4" },
];

// Chamada para a página de dicas, logo abaixo do carrossel de promoções.
export default function TipsBanner() {
  return (
    <Link to="/dicas-de-beleza" className="tips-banner">
      <div className="tips-banner-content">
        <span className="tips-banner-tag">
          <Sparkles size={14} /> Conteúdo gratuito
        </span>

        <h2>
          Os segredos que fazem a diferença
          <span>e ninguém te conta</span>
        </h2>

        <p>
          {TOTAL_TIPS} dicas práticas de pele, maquiagem, cabelo e perfume — do jeito que
          realmente funciona no dia a dia.
        </p>

        <span className="tips-banner-cta">
          Ver as dicas
          <span className="tips-banner-arrow" aria-hidden="true">
            →
          </span>
        </span>
      </div>

      {/* Ilustração decorativa: some para leitores de tela, já que o texto
          ao lado sozinho já diz tudo. */}
      <div className="tips-banner-art" aria-hidden="true">
        <span className="tips-banner-glow" />
        {FLOATING.map(({ Icon, className }) => (
          <span key={className} className={className}>
            <Icon size={22} />
          </span>
        ))}
      </div>
    </Link>
  );
}
