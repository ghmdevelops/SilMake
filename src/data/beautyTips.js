// Conteúdo da página de dicas (/dicas-de-beleza).
//
// Separado do componente de propósito: aqui é só texto, e você consegue
// editar, acrescentar ou remover dicas sem encostar no código da página.
// Se um dia migrar para o painel admin, é este arquivo que vira uma tabela
// no banco.
//
// `categoria` liga a seção à vitrine filtrada. O nome precisa bater com a
// categoria cadastrada nos produtos, senão o link leva a uma lista vazia.
export const BEAUTY_TIPS = [
  {
    id: "pele",
    title: "Cuidados com a pele",
    intro: "A base de qualquer maquiagem bonita é uma pele bem cuidada.",
    categoria: "Skincare",
    tips: [
      {
        title: "Limpe o rosto antes de dormir",
        text: "Dormir de maquiagem entope os poros e é uma das causas mais comuns de cravos. Mesmo cansada, passe um demaquilante ou água micelar — leva menos de um minuto.",
      },
      {
        title: "Hidrate mesmo se a pele for oleosa",
        text: "Pele oleosa também desidrata. Quando falta água, ela produz ainda mais óleo para compensar. Prefira hidratante em gel, de textura leve.",
      },
      {
        title: "Protetor solar todos os dias",
        text: "Inclusive em dia nublado e dentro de casa. É o item que mais previne manchas e linhas finas — nenhum outro produto compensa a falta dele.",
      },
      {
        title: "Esfolie no máximo duas vezes por semana",
        text: "Esfoliar demais remove a barreira natural de proteção e deixa a pele sensível e avermelhada. Menos é mais.",
      },
      {
        title: "Teste o produto novo antes do rosto",
        text: "Passe um pouco atrás da orelha ou no antebraço e espere 24 horas. Descobrir uma alergia no rosto inteiro é bem pior do que num pedacinho escondido.",
      },
      {
        title: "Água micelar não dispensa a limpeza",
        text: "Ela remove a maquiagem, mas deixa resíduo. Em dias de maquiagem pesada, passe o sabonete facial depois — é o que realmente limpa o poro.",
      },
    ],
  },
  {
    id: "sobrancelhas",
    title: "Sobrancelhas",
    intro: "É o que mais muda a expressão do rosto — e o que mais se erra.",
    categoria: "Maquiagem",
    tips: [
      {
        title: "Siga o formato que você já tem",
        text: "A sobrancelha natural acompanha o osso da testa. Tentar mudar o desenho por completo costuma deixar o olhar estranho — o ajuste fino funciona melhor que a reinvenção.",
      },
      {
        title: "Penteie antes de preencher",
        text: "Escove os fios para cima e veja onde realmente falta. Muita gente preenche áreas que já tinham fio, e o resultado fica pesado.",
      },
      {
        title: "Use tom mais claro que o cabelo",
        text: "Um a dois tons abaixo. Sobrancelha mais escura que o cabelo é o que dá aquele aspecto artificial de sobrancelha desenhada.",
      },
      {
        title: "Cera fixa o fio rebelde",
        text: "Depois de preencher, a cera segura o fio no lugar o dia inteiro. É o passo que faz a sobrancelha continuar bonita à noite.",
      },
      {
        title: "Nunca tire de cima da linha",
        text: "A parte de cima define o arco. Depilar ali afina e levanta demais, e é o tipo de erro que leva meses para crescer de volta.",
      },
      {
        title: "Confira com luz natural",
        text: "Luz de banheiro engana e esconde falhas de simetria. Antes de terminar, olhe o resultado perto da janela e de longe, não só de pertinho no espelho.",
      },
    ],
  },
  {
    id: "olhos",
    title: "Olhos e cílios",
    intro: "Truques que abrem o olhar sem precisar de muita técnica.",
    categoria: "Maquiagem",
    tips: [
      {
        title: "Curvex antes do rímel, nunca depois",
        text: "Curvar o cílio já com produto quebra o fio. E o curvex faz mais diferença no olhar do que camada extra de máscara.",
      },
      {
        title: "Movimento de ziguezague na raiz",
        text: "Comece na base do cílio e vá subindo em ziguezague. É ali que o volume aparece — só passar na ponta deixa o cílio pesado e sem curvatura.",
      },
      {
        title: "Esfumar é ir devagar",
        text: "Pouco produto, muitas camadas. Sombra demais de uma vez não tem como corrigir, e tentar esfumar depois só espalha a mancha.",
      },
      {
        title: "Lápis claro na linha d'água abre o olhar",
        text: "Se o seu olho é pequeno, prefira um tom nude na linha d'água inferior: dá sensação de olho maior e mais desperto. O preto fecha.",
      },
      {
        title: "Primer de pálpebra evita o vinco",
        text: "É o que impede a sombra de acumular na dobra depois de algumas horas. Numa emergência, uma camada finíssima de corretivo selada com pó resolve.",
      },
      {
        title: "Óleo remove rímel sem puxar o cílio",
        text: "Encoste o algodão embebido e espere uns 20 segundos antes de deslizar. Esfregar seco é a principal causa de cílio caindo.",
      },
    ],
  },
  {
    id: "labios",
    title: "Lábios",
    intro: "Lábio ressecado estraga qualquer batom, por melhor que ele seja.",
    categoria: "Maquiagem",
    tips: [
      {
        title: "Esfolie com açúcar e mel",
        text: "Uma vez por semana, movimentos leves. Batom em lábio descamando acumula nas partes secas e marca cada rachadura.",
      },
      {
        title: "Hidrate e espere antes do batom",
        text: "Passe o hidratante labial, espere uns dois minutos e retire o excesso. Batom sobre lábio escorregadio não fixa.",
      },
      {
        title: "Lápis contorna e segura",
        text: "Além de definir o formato, o lápis cria uma barreira que impede o batom de escorrer para as linhas ao redor da boca.",
      },
      {
        title: "Batom líquido pede camada fina",
        text: "Camada grossa demora a secar, gruda e craquela. Uma fina, seca, e outra fina por cima dura muito mais.",
      },
      {
        title: "Cor escura exige contorno preciso",
        text: "Vermelho e vinho denunciam qualquer tremida. Apoie o cotovelo na mesa e faça o contorno em traços curtos, nunca de uma vez só.",
      },
      {
        title: "Protetor labial com FPS",
        text: "O lábio não produz melanina e queima fácil. É também uma das regiões onde o ressecamento por sol mais aparece.",
      },
    ],
  },
  {
    id: "maquiagem",
    title: "Maquiagem que dura o dia todo",
    intro: "Truques simples que mudam o resultado final.",
    categoria: "Maquiagem",
    tips: [
      {
        title: "Prepare a pele antes da base",
        text: "Hidratante e primer criam uma superfície uniforme. Sem isso, a base agarra nas partes secas e craquela ao longo do dia.",
      },
      {
        title: "Aplique a base do centro para fora",
        text: "É no centro do rosto que se concentra a vermelhidão. Espalhando de dentro para fora você usa menos produto e evita o efeito máscara na linha do queixo.",
      },
      {
        title: "Sele com pó apenas onde brilha",
        text: "Testa, nariz e queixo. Passar pó no rosto inteiro resseca a aparência e marca linhas de expressão.",
      },
      {
        title: "Batom dura mais em duas camadas",
        text: "Passe a primeira, retire o excesso com um lenço, passe a segunda. O pigmento fixa no lábio em vez de ficar só por cima.",
      },
      {
        title: "Corretivo em triângulo invertido",
        text: "Em vez de acompanhar a olheira em meia-lua, desenhe um triângulo com a ponta para baixo. Ilumina a região inteira e não marca a dobra.",
      },
      {
        title: "Esponja úmida, nunca seca",
        text: "Molhe e torça bem antes de usar. Esponja seca absorve a base em vez de aplicar — você gasta o dobro de produto para a metade do resultado.",
      },
    ],
  },
  {
    id: "rotina",
    title: "Rotina de 5 minutos",
    intro: "Para os dias em que não dá tempo de nada.",
    tips: [
      {
        title: "Escolha um ponto de foco",
        text: "Ou olho marcado, ou boca forte — nunca os dois com pressa. Tentar fazer tudo rápido é o que dá errado.",
      },
      {
        title: "Corretivo no lugar da base",
        text: "Só onde precisa: olheira, cantinho do nariz e alguma marca. Leva um terço do tempo e o resultado fica mais natural.",
      },
      {
        title: "Blush também nas pálpebras",
        text: "O mesmo produto no rosto e um toque leve na pálpebra unifica o visual e economiza um passo inteiro.",
      },
      {
        title: "Deixe tudo separado na noite anterior",
        text: "Cinco produtos numa necessáire pequena. A maior parte do tempo perdido de manhã é procurando o que usar.",
      },
      {
        title: "Aposte no multifuncional",
        text: "Um batom cremoso serve de blush; um lápis marrom serve de sombra e de sobrancelha. Menos produto, menos decisão, menos tempo.",
      },
      {
        title: "Rímel só nos cílios de cima",
        text: "Os de baixo levam o dobro do cuidado para não borrar e quase não mudam o resultado à distância.",
      },
    ],
  },
  {
    id: "erros",
    title: "Erros que estragam o resultado",
    intro: "Coisas comuns que passam despercebidas.",
    tips: [
      {
        title: "Base no tom do braço",
        text: "Teste sempre na linha do maxilar, com luz natural. A pele do braço tem tom diferente da do rosto, e é por isso que a base fica marcando o pescoço.",
      },
      {
        title: "Pincel sujo",
        text: "Além de causar espinha, pincel com resíduo mistura cores e deixa tudo embaçado. É a causa mais comum de maquiagem que não fica como no vídeo.",
      },
      {
        title: "Produto demais",
        text: "Corrigir excesso é muito mais difícil que adicionar. Comece com metade do que você acha necessário.",
      },
      {
        title: "Pular o protetor solar por causa da base",
        text: "O FPS que vem na base quase nunca é suficiente, porque ninguém aplica a quantidade necessária para atingir aquela proteção. São produtos diferentes.",
      },
      {
        title: "Emprestar maquiagem",
        text: "Rímel, lápis de olho e batom encostam em mucosa. Compartilhar é caminho direto para conjuntivite e herpes labial, mesmo entre pessoas próximas.",
      },
      {
        title: "Aplicar tudo na mesma luz",
        text: "Maquiagem feita sob luz amarela costuma ficar pesada demais na luz do dia. Se puder, finalize perto da janela.",
      },
    ],
  },
  {
    id: "perfume",
    title: "Perfume que fixa",
    intro: "Não é só o perfume — é onde e como você aplica.",
    categoria: "Perfumaria",
    tips: [
      {
        title: "Aplique na pele hidratada",
        text: "Pele seca não segura fragrância. Passe hidratante sem cheiro antes e o perfume dura visivelmente mais.",
      },
      {
        title: "Não esfregue os pulsos",
        text: "O atrito aquece e quebra as notas mais delicadas da fragrância. Borrife e deixe secar naturalmente.",
      },
      {
        title: "Prefira os pontos de pulso",
        text: "Pulsos, atrás das orelhas e na dobra dos cotovelos. São regiões mais quentes, que ajudam a projetar o perfume.",
      },
      {
        title: "Guarde longe do banheiro",
        text: "Calor e umidade alteram a composição. Um armário no quarto conserva muito melhor que a prateleira do box.",
      },
      {
        title: "Camadas da mesma linha duram mais",
        text: "Hidratante e perfume da mesma fragrância se reforçam. É o truque que faz o cheiro atravessar o dia sem precisar reaplicar.",
      },
      {
        title: "No cabelo, com moderação",
        text: "O fio segura o cheiro por muito tempo, mas o álcool resseca. Borrife na escova e penteie, em vez de aplicar direto.",
      },
    ],
  },
  {
    id: "unhas",
    title: "Unhas",
    intro: "Esmalte bem feito em casa é questão de preparo, não de pressa.",
    tips: [
      {
        title: "Lixe sempre no mesmo sentido",
        text: "Vai e volta com a lixa serrilha a ponta e é o que faz a unha lascar depois. Escolha uma direção e mantenha.",
      },
      {
        title: "Base antes, sempre",
        text: "Além de fazer o esmalte durar mais, ela evita que pigmentos escuros, principalmente vermelho e roxo, manchem a unha de amarelo.",
      },
      {
        title: "Camadas finas secam melhor",
        text: "Duas finas duram mais que uma grossa. A camada grossa parece seca por fora mas continua mole por baixo, e marca em qualquer encosto.",
      },
      {
        title: "Selar a ponta evita o descascado",
        text: "Passe o pincel na borda livre da unha. É por ali que o esmalte começa a soltar.",
      },
      {
        title: "Hidrate a cutícula em vez de cortar",
        text: "A cutícula protege a raiz da unha contra infecção. Amolecer e empurrar dá um acabamento parecido, sem o risco.",
      },
      {
        title: "Dê intervalos sem esmalte",
        text: "Alguns dias por mês só com base fortalecedora. Unha sempre coberta fica amarelada e quebradiça.",
      },
    ],
  },
  {
    id: "cabelos",
    title: "Cabelos",
    intro: "O básico que evita a maior parte dos problemas.",
    tips: [
      {
        title: "Shampoo na raiz, condicionador no comprimento",
        text: "A oleosidade nasce no couro cabeludo; a secura fica nas pontas. Inverter isso deixa a raiz pesada e a ponta ressecada.",
      },
      {
        title: "Água morna, nunca quente",
        text: "Água muito quente abre demais a cutícula e leva embora a proteção natural do fio. O frizz costuma começar aí.",
      },
      {
        title: "Protetor térmico antes do calor",
        text: "Secador, chapinha e babyliss passam dos 180°C. Sem protetor, o dano é cumulativo e não tem como reverter — só cortando.",
      },
      {
        title: "Não prenda o cabelo molhado",
        text: "O fio molhado está mais frágil e estica. Prender assim é uma das causas mais comuns de quebra na altura do elástico.",
      },
      {
        title: "Fronha de cetim reduz o frizz",
        text: "O algodão puxa a umidade do fio e cria atrito a noite inteira. É a mudança mais barata com resultado visível em cabelo cacheado.",
      },
      {
        title: "Corte as pontas mesmo querendo comprimento",
        text: "Ponta dupla sobe pelo fio. Aparar um pouco a cada três ou quatro meses faz o cabelo crescer mais bonito — e, na prática, mais rápido.",
      },
    ],
  },
  {
    id: "conservacao",
    title: "Conservação dos produtos",
    intro: "Cosmético vencido perde efeito e pode irritar a pele.",
    tips: [
      {
        title: "Repare no prazo após a abertura",
        text: "Aquele desenho de potinho com um número (6M, 12M) indica quantos meses o produto dura depois de aberto — é diferente da validade da embalagem fechada.",
      },
      {
        title: "Lave os pincéis a cada 15 dias",
        text: "Pincel sujo acumula oleosidade e bactérias, e é uma causa frequente de espinhas. Água morna e sabão neutro resolvem.",
      },
      {
        title: "Nunca complete o rímel com água",
        text: "Isso contamina o produto e pode causar infecção nos olhos. Rímel tem vida curta: cerca de três meses após aberto.",
      },
      {
        title: "Feche bem e evite o sol",
        text: "Luz e calor degradam ativos, principalmente em séruns com vitamina C, que oxidam e mudam de cor.",
      },
      {
        title: "Não deixe maquiagem no carro",
        text: "O porta-luvas passa fácil dos 50°C parado no sol. Base separa, batom derrete e a fórmula não volta ao que era.",
      },
      {
        title: "Mão limpa antes de mexer no pote",
        text: "Creme em pote aberto com o dedo recebe tudo que estava na sua mão. Uma espátula pequena multiplica a vida útil do produto.",
      },
    ],
  },
];
