import { useEffect, useState } from "react";
import { subscribeProductCosts } from "../api/productCosts";

// Custos por id de produto, em tempo real. Devolve {} para quem não é admin,
// porque as regras do Firebase recusam a leitura — e é justamente esse o
// ponto: o custo não sai do painel.
export function useProductCosts() {
  const [costs, setCosts] = useState({});

  useEffect(() => subscribeProductCosts(setCosts), []);

  return costs;
}
