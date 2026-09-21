import { buildWhatsappLink } from "../config";
import "./WhatsappButton.css";

export default function WhatsappButton() {
  return (
    <a
      href={buildWhatsappLink("Olá! Vim pela loja SilBeauty e gostaria de saber mais.")}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-btn"
      aria-label="Falar no WhatsApp"
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
        <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 4.99L2 22l5.2-1.36a9.94 9.94 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm5.83 14.19c-.24.68-1.4 1.3-1.93 1.35-.5.05-1.02.24-3.4-.72-2.88-1.16-4.73-4.07-4.87-4.26-.14-.19-1.16-1.55-1.16-2.96s.73-2.1 1-2.39c.26-.28.57-.35.76-.35h.54c.17 0 .4-.03.62.48.24.56.8 1.93.87 2.07.07.14.11.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.28-.12.55.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.6-.14.24.09 1.53.72 1.79.85.26.14.44.2.5.32.06.12.06.68-.18 1.36z" />
      </svg>
    </a>
  );
}
