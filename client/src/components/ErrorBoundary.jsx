import { Component } from "react";
import "./ErrorBoundary.css";

// Rede de segurança: se qualquer componente lançar um erro durante a
// renderização, o React desmonta a árvore inteira e o cliente veria uma
// página branca. Este componente intercepta o erro e mostra uma saída.
// Precisa ser uma classe — é a única forma de capturar erros de renderização.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "", lastResetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "" };
  }

  // Sem isto, a tela de erro ficaria travada mesmo depois de o cliente
  // navegar para outra página. Quando a rota muda (resetKey), voltamos a
  // tentar renderizar normalmente.
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey === state.lastResetKey) return null;

    return state.hasError
      ? { hasError: false, message: "", lastResetKey: props.resetKey }
      : { lastResetKey: props.resetKey };
  }

  componentDidCatch(error, info) {
    console.error("Erro não tratado na interface:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    // Recarrega na home para garantir uma árvore de componentes limpa.
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <span className="error-boundary-icon">💔</span>
        <h1>Algo deu errado por aqui</h1>
        <p>
          Tivemos um problema inesperado ao carregar esta parte da loja. Nada foi perdido — seu
          carrinho e sua conta continuam salvos.
        </p>

        <div className="error-boundary-actions">
          <button className="btn btn-primary" onClick={this.handleReload}>
            Tentar de novo
          </button>
          <button className="btn btn-ghost" onClick={this.handleGoHome}>
            Voltar para a loja
          </button>
        </div>

        {this.state.message && (
          <details className="error-boundary-details">
            <summary>Detalhes técnicos</summary>
            <code>{this.state.message}</code>
          </details>
        )}
      </div>
    );
  }
}
