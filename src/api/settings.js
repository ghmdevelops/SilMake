import { db } from "../firebase";
import { ref, set } from "firebase/database";
import { onlyDigits } from "./cep";

// Configurações de frete, editáveis pelo admin no painel.
// Ficam num nó separado (`settings/shipping`) com leitura pública, para que a
// loja calcule o frete sem precisar de login.
export const DEFAULT_SHIPPING = {
  fee: 0,
  freeAbove: 0,
  note: "",
  originCep: "",
};

function toNumber(value) {
  return Number(String(value ?? "").replace(",", ".")) || 0;
}

// Entrega própria: SOMENTE quando o CEP do cliente é exatamente o mesmo da
// loja. É proposital ser restrito — qualquer abertura (mesmo bairro, mesma
// cidade) daria entrega gratuita a endereços que você não atende.
export function isLocalCep(destinationCep, shipping = DEFAULT_SHIPPING) {
  const destination = onlyDigits(destinationCep);
  const origin = onlyDigits(shipping?.originCep);

  return destination.length === 8 && origin.length === 8 && destination === origin;
}

export function saveShippingSettings({ fee, freeAbove, note, originCep }) {
  const shippingRef = ref(db, "settings/shipping");
  return set(shippingRef, {
    fee: toNumber(fee),
    freeAbove: toNumber(freeAbove),
    note: note || "",
    // CEP de onde as encomendas saem — obrigatório para a cotação real.
    // Também é o que define quem ganha entrega própria gratuita.
    originCep: (originCep || "").replace(/\D/g, ""),
    updatedAt: Date.now(),
  });
}

// Calcula o frete de um carrinho: um valor único para todos os pedidos, que
// zera quando o subtotal alcança o mínimo para frete grátis.
export function calculateShipping(subtotal, shipping = DEFAULT_SHIPPING) {
  const fee = toNumber(shipping?.fee);
  const freeAbove = toNumber(shipping?.freeAbove);

  if (fee <= 0) return { fee: 0, isFree: true, freeAbove };
  if (freeAbove > 0 && subtotal >= freeAbove) return { fee: 0, isFree: true, freeAbove };

  return { fee, isFree: false, freeAbove };
}

// Decide o que mostrar no lugar do frete, em ordem de prioridade. Serve para
// o carrinho e o mini-carrinho exibirem sempre a mesma coisa.
//
// A diferença importante é o estado "pending": quando a loja cobra frete mas
// ainda não sabemos o destino, o certo é dizer "a calcular" — anunciar
// "Grátis" nesse momento seria mentira, e o cliente descobriria a cobrança
// só no final.
export function resolveShipping({
  subtotal,
  shipping = DEFAULT_SHIPPING,
  selectedOption = null,
  destinationCep = "",
  // true quando a cotação já foi tentada e não retornou opções (sem token,
  // fora do ar, CEP sem atendimento...). Nesse caso NÃO podemos travar o
  // cliente esperando um valor que nunca vai chegar.
  quoteUnavailable = false,
}) {
  const fee = toNumber(shipping?.fee);
  const freeAbove = toNumber(shipping?.freeAbove);
  const origin = onlyDigits(shipping?.originCep);
  const destination = onlyDigits(destinationCep);

  // 1. Frete grátis por valor vale para qualquer destino.
  if (freeAbove > 0 && subtotal >= freeAbove) {
    return { fee: 0, isFree: true, pending: false };
  }

  // 2. Mesmo CEP da loja: não há transportadora envolvida, então não há
  // frete. Para o cliente isso é "entrega grátis" — chamar de "retirada"
  // dava a entender que ele é quem teria que buscar.
  //
  // Vem ANTES da cotação de propósito: não faz sentido consultar o Melhor
  // Envio para um endereço que você mesma vai levar.
  if (isLocalCep(destination, shipping)) {
    return { fee: 0, isFree: true, pending: false, isLocalDelivery: true };
  }

  // 3. O cliente já escolheu uma opção cotada.
  if (selectedOption) {
    return { fee: Number(selectedOption.price) || 0, isFree: false, pending: false };
  }

  // 4. A loja tem cotação configurada e ela ainda pode responder.
  if (origin.length === 8 && !quoteUnavailable) {
    return { fee: 0, isFree: false, pending: true };
  }

  // 5. Sem cotação disponível, mas com frete fixo definido: cobra o fixo.
  if (fee > 0) return { fee, isFree: false, pending: false };

  // 6. Não sabemos o valor e não há fixo definido. Aqui NÃO dizemos "grátis":
  // o envio tem custo e será acertado com o cliente. Dizer grátis faria a
  // loja prometer algo que não vai cumprir.
  return { fee: 0, isFree: false, pending: false, toBeArranged: true };
}

// Quanto falta para o cliente ganhar frete grátis (0 quando já ganhou ou
// quando não existe essa promoção configurada).
export function missingForFreeShipping(subtotal, shipping = DEFAULT_SHIPPING) {
  const freeAbove = toNumber(shipping?.freeAbove);
  if (freeAbove <= 0) return 0;
  return Math.max(0, freeAbove - subtotal);
}
