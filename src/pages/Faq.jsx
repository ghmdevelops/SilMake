import { useState } from "react";
import { useSeo } from "../hooks/useSeo";
import "./StaticPage.css";

const faqs = [
  {
    question: "Como faço para comprar um produto?",
    answer:
      "Navegue pela loja, escolha o produto desejado, clique em \"Adicionar\" e depois acesse o carrinho para revisar seu pedido.",
  },
  {
    question: "Quais formas de pagamento vocês aceitam?",
    answer:
      "No momento o carrinho é apenas demonstrativo. Para finalizar uma compra de verdade, entre em contato diretamente pelos canais informados no rodapé.",
  },
  {
    question: "Como funciona a entrega?",
    answer:
      "Cada produto é feito ou preparado sob encomenda. O prazo de entrega é combinado diretamente com a loja no momento da compra.",
  },
  {
    question: "Posso trocar ou devolver um produto?",
    answer:
      "Sim! Entre em contato em até 7 dias após o recebimento para combinarmos a troca ou devolução, conforme o Código de Defesa do Consumidor.",
  },
  {
    question: "Os produtos são realmente artesanais?",
    answer:
      "Sim, todos os produtos da SilMake são feitos à mão ou personalizados com bastante cuidado e atenção aos detalhes.",
  },
  {
    question: "Como entro em contato com a loja?",
    answer:
      "Você pode enviar um e-mail para contato@silmake.com ou usar os canais de contato informados no rodapé do site.",
  },
];

export default function Faq() {
  useSeo({
    title: "Perguntas Frequentes",
    description:
      "Tire suas dúvidas sobre compras, entregas, trocas e pagamentos na loja SilMake.",
  });

  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="static-page">
      <h1>Perguntas Frequentes</h1>
      <p className="static-page-subtitle">Tudo o que você precisa saber antes de comprar.</p>

      <div className="faq-list">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div className={`faq-item ${isOpen ? "open" : ""}`} key={faq.question}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
              >
                {faq.question}
                <span className="faq-question-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
