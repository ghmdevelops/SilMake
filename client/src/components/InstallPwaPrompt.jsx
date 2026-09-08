import { useEffect, useState } from "react";
import "./InstallPwaPrompt.css";

const STORAGE_KEY = "silmake_install_dismissed";

export default function InstallPwaPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      if (localStorage.getItem(STORAGE_KEY)) return;
      setDeferredEvent(e);
      setTimeout(() => setVisible(true), 800);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredEvent) return;
    deferredEvent.prompt();
    await deferredEvent.userChoice;
    setVisible(false);
    setDeferredEvent(null);
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="install-prompt">
      <span className="install-prompt-icon">📲</span>
      <div className="install-prompt-text">
        <strong>Instale a SilMake</strong>
        <p>Adicione o app na sua tela inicial para acesso rápido, mesmo offline.</p>
      </div>
      <div className="install-prompt-actions">
        <button className="btn btn-ghost" onClick={handleDismiss}>
          Agora não
        </button>
        <button className="btn btn-primary" onClick={handleInstall}>
          Instalar
        </button>
      </div>
    </div>
  );
}
