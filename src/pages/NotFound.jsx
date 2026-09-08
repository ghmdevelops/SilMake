import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";
import "./NotFound.css";

export default function NotFound() {
  useSeo({
    title: "Página não encontrada",
    description: "A página que você procura não existe ou foi movida.",
  });

  return (
    <div className="not-found">
      <span className="not-found-code">404</span>
      <h1>Página não encontrada</h1>
      <p>Ops! O link que você acessou não existe ou foi movido.</p>
      <Link to="/" className="btn btn-primary">
        Voltar para a loja
      </Link>
    </div>
  );
}
