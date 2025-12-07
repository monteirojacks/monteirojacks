
import { MonthConfig, JournalEntry } from '../types';

let globalDayCounter = 1;

const createEntry = (monthId: number, dayOfMonth: number, question: string): JournalEntry => {
  const entry: JournalEntry = {
    id: `mes_${monthId}_dia_${dayOfMonth}`,
    dayNumber: globalDayCounter,
    dayOfMonth: dayOfMonth,
    question: question,
    placeholder: "Sua reflexão..."
  };
  globalDayCounter++;
  return entry;
};

// Helper to fill gap days if provided questions are fewer than days in month (fallback)
const fillRemainingDays = (monthId: number, startDay: number, totalDays: number, entries: JournalEntry[]) => {
  for (let d = startDay; d <= totalDays; d++) {
    entries.push(createEntry(monthId, d, "Espaço para reflexão livre."));
  }
};

const generateMonth = (
  id: number, 
  name: string, 
  theme: string, 
  objective: string, 
  anchor: string, 
  exTitle: string, 
  exSteps: string[],
  questionBlocks: { questions: string[] }[],
  totalDaysInMonth: number,
  reviewQuestions: string[]
): MonthConfig => {
  
  const days: JournalEntry[] = [];
  
  // Flatten questions
  let dayOfMonth = 1;
  questionBlocks.forEach(block => {
    block.questions.forEach(q => {
      if (dayOfMonth <= totalDaysInMonth) {
        days.push(createEntry(id, dayOfMonth, q));
        dayOfMonth++;
      }
    });
  });

  // If prompts run out before month ends (e.g., Feb 29), fill logic or manual add
  if (dayOfMonth <= totalDaysInMonth) {
     for (let d = dayOfMonth; d <= totalDaysInMonth; d++) {
        days.push(createEntry(id, d, "Espaço livre para reflexão do dia."));
     }
  }

  // Review Page
  days.push({
    id: `mes_${id}_revisao`,
    dayNumber: globalDayCounter, // It doesn't consume a 'day' index strictly but keeping order
    dayOfMonth: 99, // Flag
    question: "Revisão do Mês",
    isMonthlyReview: true,
    placeholder: reviewQuestions.join("\n\n") // Hint in placeholder or handled in UI
  });

  return {
    id, name, theme, objective, anchorQuestion: anchor, exerciseTitle: exTitle, exerciseSteps: exSteps, days
  };
};

export const monthsData: MonthConfig[] = [];

// --- JANEIRO ---
monthsData.push(generateMonth(
  1, "Janeiro", "Minhas raízes pessoais",
  "Estabelecer as bases para um ano de presença consciente, definindo não metas rígidas, mas intenções claras.",
  "Quem eu quero ser enquanto caminho este ano?",
  "A Roda da Intenção",
  ["Sente-se em silêncio por 5 minutos.", "Visualize três áreas da sua vida: Pessoal, Profissional e Relacional.", "Para cada uma, escreva uma palavra-chave que guiará suas atitudes.", "Respire fundo e imagine essas palavras se integrando ao seu dia a dia."],
  [
    { questions: ["Se eu pudesse contar minha história em três capítulos, quais seriam?", "Qual é a lembrança mais antiga que ainda influencia quem sou hoje?", "Que traço da minha personalidade mais parece ter vindo da minha família?", "Que parte da minha história eu demorei para aceitar?", "Como meu contexto de origem moldou meus sonhos e limites?", "O que eu chamaria de “terreno fértil” da minha vida?", "Quais acontecimentos me transformaram profundamente — para melhor ou pior?"] }, // 1-7
    { questions: ["Qual história familiar sempre foi contada e que impacto ela tem em mim?", "O que eu aprendi, mesmo sem ter sido ensinado verbalmente?", "Que valores da minha família eu carrego com orgulho?", "Que padrões familiares quero quebrar?", "Como minha ancestralidade se expressa nos meus gestos, falas ou escolhas?", "O que eu gostaria de perguntar para meus antepassados?", "Qual memória familiar me dá força nos dias difíceis?"] }, // 8-14
    { questions: ["Como a cultura do lugar onde cresci influenciou meu modo de ser?", "Que histórias da minha cidade, bairro ou comunidade fazem parte de mim?", "Que frases, ditos populares ou hábitos culturais me moldaram?", "Como o contexto social da minha infância impacta minhas decisões atuais?", "Que costumes culturais me fortalecem — e quais eu quero deixar?", "Que papel minha escola, igreja ou grupos sociais tiveram na minha formação?", "O que eu teria sido se tivesse nascido em outro contexto?"] }, // 15-21
    { questions: ["Qual história sobre mim eu repito com frequência — e ela ainda é verdadeira?", "Quais rótulos sociais ou familiares eu já carreguei sem perceber?", "Que versão de mim eu tentei ser para agradar alguém?", "Que parte do meu passado eu já superei, mas ainda não reconheci isso?", "Qual acontecimento antigo ainda dói e precisa de acolhimento?", "O que minha criança interior precisava ouvir que nunca ouviu?", "Minha história é marcada mais por quedas ou recomeços? Por quê?"] }, // 22-28
    { questions: ["Que parte da minha história eu gostaria que continuasse pelas próximas gerações?", "O que eu quero construir a partir de quem já fui?", "Se eu pudesse escrever uma frase para resumir minha jornada até aqui, qual seria?"] } // 29-31
  ],
  31,
  ["1. O que descobri sobre minhas origens?", "2. Que memórias precisam ser honradas?", "3. Que padrões quero transformar?", "4. Quais sementes quero plantar para o restante do ano?"]
));

// --- FEVEREIRO ---
monthsData.push(generateMonth(
  2, "Fevereiro", "Autocuidado e Amor-Próprio",
  "Transformar hábitos automáticos em momentos de conexão consigo mesmo.",
  "Onde posso colocar mais amor na minha rotina?",
  "O Café da Manhã Consciente",
  ["Amanhã, prepare sua primeira refeição sem telas (celular/TV).", "Sinta a textura, o cheiro e o sabor de cada item.", "Agradeça mentalmente pelo alimento.", "Perceba como isso afeta o ritmo do seu dia."],
  [
    { questions: ["O que significa “me cuidar” na prática, hoje?", "Em quais momentos costumo me abandonar?", "Como eu percebo quando estou no meu limite?", "Que necessidades minhas eu ignoro com frequência?", "Quando foi a última vez que me tratei com gentileza?", "O que eu gostaria que alguém tivesse feito por mim — mas posso fazer por mim hoje?", "Que tipo de descanso meu corpo e minha mente realmente pedem?"] },
    { questions: ["O que eu amo em mim que não depende da opinião de ninguém?", "Que pequenas atitudes diárias representam amor-próprio?", "Em quais situações eu troco minhas necessidades pelas dos outros?", "Como eu lido com minhas próprias falhas?", "De que formas posso praticar autocompaixão?", "Qual hábito nocivo quero substituir por um gesto de cuidado?", "O que me impede de me colocar em primeiro lugar sem culpa?"] },
    { questions: ["Como meu corpo sinaliza que preciso de cuidado?", "Que pensamentos reforçam meu autocuidado — e quais o sabotam?", "Como acolho minhas emoções quando elas surgem intensas?", "Que parte de mim merece mais paciência?", "O que posso fazer para tornar meus dias mais leves?", "Que práticas me trazem sensação de presença?", "O que posso fazer hoje para me sentir um pouco melhor?"] },
    { questions: ["Quais rituais de autocuidado quero incluir no meu dia?", "O que preciso diminuir para ter mais espaço para mim?", "Qual limite interno preciso respeitar?", "Qual hábito de amor-próprio posso começar agora?", "O que me impede de descansar?", "Como eu posso praticar gratidão por mim mesmo?", "O que realmente me faz sentir bem?"] },
    { questions: ["O que faria hoje se tivesse um dia “extra” só para mim?"] }
  ],
  29,
  ["O que aprendi sobre me cuidar?", "O que descobri que preciso oferecer a mim mesmo?", "Onde ainda me abandono?", "Como posso fortalecer meu amor-próprio?"]
));

// --- MARÇO ---
monthsData.push(generateMonth(
  3, "Março", "Coragem Emocional e Vulnerabilidade",
  "Aceitar as imperfeições como parte essencial da jornada de crescimento.",
  "O que eu faria se não tivesse medo de falhar?",
  "Carta para o Medo",
  ["Identifique um medo que tem te paralisado.", "Escreva uma carta curta para ele, agradecendo por tentar te proteger.", "Diga a ele que, a partir de agora, você assume o controle.", "Rasgue ou queime o papel (com segurança) para simbolizar a liberação."],
  [
    { questions: ["O que me faz sentir medo hoje?", "O que “coragem” significa na minha vida?", "Em que momentos já fui mais forte do que imaginei?", "O que eu evitaria se fosse totalmente honesto comigo?", "Qual situação atual pede minha coragem?", "O que tenho medo de perder se ousar mudar?", "Quando minha vulnerabilidade foi recebida com acolhimento?"] },
    { questions: ["O que eu venho adiando por medo?", "Quais sentimentos eu tento esconder?", "Do que eu tenho vergonha — e por quê?", "O que eu nunca contei para ninguém?", "Como posso acolher minha parte frágil?", "Que padrões emocionais me aprisionam?", "Quem sou eu quando não estou tentando ser forte?"] },
    { questions: ["O que eu evito dizer por medo de conflito?", "Como eu fujo da vulnerabilidade nos vínculos?", "O que eu precisaria falar para alguém, mas não consigo?", "O que eu preciso pedir?", "Em que momento me senti realmente visto?", "De quem eu posso me aproximar emocionalmente?", "Quem me inspira coragem?"] },
    { questions: ["O que minha vida pede que eu enfrente agora?", "Qual é o passo mais simples que posso dar com coragem?", "Qual é a consequência de continuar evitando?", "O que posso fazer para me sentir mais seguro ao enfrentar medos?", "Qual parte de mim merece ser libertada?", "Que nova atitude simboliza coragem para mim?", "Se eu não tivesse medo, o que eu faria?"] },
    { questions: ["Qual símbolo representa minha força?", "Que vitória emocional tive recentemente?", "Qual frase me lembra que eu posso continuar?"] }
  ],
  31,
  ["Do que não preciso mais fugir?", "O que a vulnerabilidade me ensinou?", "Onde descobri que sou mais forte?", "Qual coragem quero carregar para o próximo mês?"]
));

// --- ABRIL ---
monthsData.push(generateMonth(
  4, "Abril", "Valores e Direções de Vida",
  "Alinhar as escolhas diárias com o que é verdadeiramente importante.",
  "Estou caminhando para onde minha alma quer ir?",
  "Bússola de Valores",
  ["Liste 10 valores (liberdade, segurança, amor, etc.).", "Reduza para 5 essenciais.", "Reduza para os 3 inegociáveis.", "Pergunte-se: Minha semana passada honrou esses 3 valores?"],
  [
    { questions: ["Quais são meus três valores mais importantes?", "O que me faz sentir que estou vivendo minha verdade?", "Quando me sinto mais coerente comigo mesmo?", "O que me desvia do que importa?", "Que hábito está desalinhado com meus valores?", "Onde eu gostaria de ser mais autêntico?", "O que me dá sensação de sentido?"] },
    { questions: ["Em quais situações traí meus próprios valores?", "Como posso agir mais alinhado ao que acredito?", "Que decisão tomei que honra meus valores?", "O que eu faço apenas para agradar os outros?", "O que deixei de fazer por medo de julgamento?", "Como posso ser mais honesto comigo?", "Qual valor eu gostaria de fortalecer?"] },
    { questions: ["Como meus valores aparecem no meu trabalho?", "Como eles aparecem nas minhas relações?", "Como eles aparecem no meu autocuidado?", "Em quais áreas da minha vida preciso reorganizar prioridades?", "O que não combina mais com quem eu sou?", "Que compromisso posso assumir com meus valores?", "Como posso simplificar minha vida?"] },
    { questions: ["O que quero construir a partir do que valorizo?", "Qual decisão represada posso tomar agora?", "Que caminhos preciso deixar?", "Qual direção me parece mais viva?", "O que preciso aprender para seguir adiante?", "Como posso honrar meu tempo interno?", "O que significa viver uma vida com propósito?"] },
    { questions: ["Que valor me guiou este mês?", "Qual direção quero reforçar?"] }
  ],
  30,
  ["Quais valores emergiram como essenciais?", "Em que momentos vivi minha verdade?", "O que desfoca minha direção?", "Como posso avançar com mais coerência?"]
));

// --- MAIO ---
monthsData.push(generateMonth(
  5, "Maio", "Forças, Competências e Identidade Adulta",
  "Reconhecer a própria potência e assumir a responsabilidade pela própria vida.",
  "Qual é o meu superpoder subestimado?",
  "O Inventário de Potência",
  ["Liste 3 momentos difíceis que você superou.", "Para cada um, identifique qual qualidade você usou (ex: paciência, criatividade).", "Agradeça a si mesmo por ter essas ferramentas internas."],
  [
    { questions: ["Quais habilidades naturais eu reconheço em mim?", "Que elogios recebo com frequência?", "O que faço com facilidade e gosto?", "Qual qualidade minha foi construída com esforço?", "O que me diferencia das pessoas ao meu redor?", "Que força pessoal subestimo?", "Como minhas dificuldades também se tornaram força?"] },
    { questions: ["O que significa ser adulto para mim?", "Que responsabilidades carrego bem?", "Onde ainda me sinto imaturo?", "Como lido com frustrações?", "Como lido com escolhas difíceis?", "Onde demonstro maturidade?", "Que competência emocional quero desenvolver?"] },
    { questions: ["Quem sou eu quando ninguém está olhando?", "O que admiro em mim?", "O que me impede de reconhecer minhas conquistas?", "Que parte da minha história pessoal fortaleceu quem eu sou?", "Como eu me saboto quando avanço?", "O que gostaria que as pessoas percebessem sobre mim?", "Como posso afirmar minha identidade com mais confiança?"] },
    { questions: ["O que posso aprimorar no meu cotidiano?", "Que hábito me aproxima da minha melhor versão?", "Que conquista recente me orgulha?", "O que aprendi com um erro?", "Como posso celebrar pequenas vitórias?", "Qual habilidade quero desenvolver nos próximos meses?", "Que tipo de adulto quero ser?"] },
    { questions: ["Que força emergiu este mês?", "Qual identidade desejo reforçar?", "Que frase descreve meu crescimento em Maio?"] }
  ],
  31,
  ["O que descobri sobre minhas forças?", "Que competências quero desenvolver?", "Onde amadureci?", "Que versão de mim desejo fortalecer?"]
));

// --- JUNHO ---
monthsData.push(generateMonth(
  6, "Junho", "Regulação Emocional e Presença",
  "Aprender a navegar as ondas emocionais sem se afogar nelas.",
  "Quem está no comando: eu ou minha reação?",
  "A Pausa Sagrada",
  ["Sempre que sentir uma emoção forte hoje, pare por 10 segundos.", "Não reaja. Apenas sinta onde ela vibra no corpo.", "Dê um nome a ela. Depois, escolha como agir."],
  [
    { questions: ["Como reconheço minhas emoções no corpo?", "Quais emoções tenho mais dificuldade de sentir?", "O que costumo fazer quando estou sobrecarregado?", "Como lido com a raiva?", "Como lido com a tristeza?", "Como lido com a alegria?", "Quando minhas emoções me guiam — e quando me enganam?"] },
    { questions: ["O que me acalma imediatamente?", "O que piora minhas emoções?", "O que me faz sentir presente?", "Que prática posso repetir diariamente?", "O que meu corpo precisa quando sinto ansiedade?", "Qual pessoa ou ambiente me regula?", "Que emoção preciso acolher, e não reprimir?"] },
    { questions: ["Como eu funciono no piloto automático?", "O que me desconecta do presente?", "Que momentos me fazem sentir vivo?", "O que me impede de desacelerar?", "Como posso praticar atenção plena no dia a dia?", "O que me faz perder tempo emocional?", "Como posso construir dias mais conscientes?"] },
    { questions: ["Como posso responder melhor às minhas emoções?", "O que posso fazer antes de reagir impulsivamente?", "Que situação exige minha calma?", "Como posso criar pausas intencionais?", "Como posso acolher minha vulnerabilidade?", "Que emoção me surpreendeu este mês?", "O que minha vida emocional me ensinou?"] },
    { questions: ["Como minhas emoções me guiam?", "O que quero fazer com essa sabedoria?"] }
  ],
  30,
  ["Quais emoções predominaram?", "O que me ajuda a regular?", "Onde amadureci emocionalmente?", "Como posso continuar presente?"]
));

// --- JULHO ---
monthsData.push(generateMonth(
  7, "Julho", "Relações, Conexões e Pertencimento",
  "Cultivar vínculos que nutrem e estabelecer trocas saudáveis.",
  "Quem são as pessoas que me fazem sentir em casa?",
  "Círculos de Relacionamento",
  ["Desenhe 3 círculos concêntricos.", "Centro: Pessoas íntimas e vitais.", "Meio: Amigos e companhias boas.", "Borda: Conhecidos.", "Reflita: Alguém está no círculo errado?"] ,
  [
    { questions: ["O que busco nas minhas relações?", "O que mais valorizo em um vínculo?", "Quem me faz sentir seguro?", "Quem esgota minhas energias?", "Como costumo demonstrar afeto?", "Como costumo receber afeto?", "O que me impede de me aproximar mais das pessoas?"] },
    { questions: ["Como lido com conflitos?", "Como reajo quando me sinto rejeitado?", "Como ajo quando sinto que estou perdendo alguém?", "Quais padrões repito nas relações?", "De quem aprendi isso?", "Qual vínculo merece minha atenção agora?", "O que preciso parar de tolerar?"] },
    { questions: ["O que me deixa vulnerável nos vínculos?", "Quem me permite ser quem eu sou?", "Onde escondo partes minhas?", "O que dificulta minha autenticidade?", "Como posso construir relações mais verdadeiras?", "O que eu gostaria de ouvir de alguém importante?", "O que eu gostaria de dizer a alguém?"] },
    { questions: ["Onde me sinto pertencente?", "Qual pessoa representa acolhimento?", "Como posso nutrir minhas amizades?", "Qual relação precisa de limite?", "Como posso criar vínculos mais saudáveis?", "Que tipo de relação quero cultivar?", "Quem eu me torno perto das pessoas certas?"] },
    { questions: ["Quem fortaleceu meu mês?", "Quem eu fortaleci?", "Que tipo de vínculo quero levar para o futuro?"] }
  ],
  31,
  ["Quem sou nas minhas relações?", "Que vínculos importam de verdade?", "Que padrões quero quebrar?", "Como posso me conectar melhor?"]
));

// --- AGOSTO ---
monthsData.push(generateMonth(
  8, "Agosto", "Metas, Autonomia e Organização da Vida",
  "Transformar sonhos em planos e planos em realidade.",
  "O que eu faria se soubesse que é capaz de lidar com qualquer resultado?",
  "A Matriz do Agora",
  ["Divida uma folha em 4 quadrantes: Urgente, Importante, Delegável, Eliminável.", "Categorize suas tarefas da semana.", "Comprometa-se a focar no quadrante 'Importante' (que não é urgente) por 1h."],
  [
    { questions: ["O que quero alcançar nos próximos meses?", "Por que isso é importante para mim?", "O que me impede de avançar?", "O que me motiva?", "Que meta me dá medo?", "Que meta me dá entusiasmo?", "Qual pequena ação posso fazer hoje?"] },
    { questions: ["Onde dependo demais dos outros?", "Onde sou excessivamente independente?", "Em que área desejo mais autonomia?", "Que decisão venho adiando?", "De quem preciso me desvincular para avançar?", "Como posso confiar mais em mim?", "Que atitude simboliza minha independência?"] },
    { questions: ["Como posso simplificar minha rotina?", "Como posso melhorar meu foco?", "Que hábito está roubando minha produtividade?", "O que posso parar de fazer?", "O que posso delegar?", "O que posso priorizar?", "Como posso estruturar melhor meus dias?"] },
    { questions: ["Como lido com frustrações ao perseguir metas?", "O que faço quando erro?", "Como posso me responsabilizar sem me culpar?", "Como posso manter constância?", "O que me distrai do que é importante?", "Como posso celebrar progressos?", "O que preciso finalizar antes de começar algo novo?"] },
    { questions: ["O que realizei este mês?", "O que quero ajustar?", "Qual direção quero reforçar?"] }
  ],
  31,
  ["O que avancei?", "Onde me organizei melhor?", "Onde preciso ajustar?", "Como posso seguir com autonomia?"]
));

// --- SETEMBRO ---
monthsData.push(generateMonth(
  9, "Setembro", "Limites, Assertividade e Autorespeito",
  "Aprender que dizer 'não' para o outro pode ser um 'sim' para si mesmo.",
  "O que eu estou tolerando que custa minha paz?",
  "O 'Não' Consciente",
  ["Identifique um convite ou favor que você não quer fazer.", "Escreva um 'não' gentil mas firme (sem excesso de justificativas).", "Treine falar isso em voz alta no espelho."],
  [
    { questions: ["Onde tenho dificuldade de dizer “não”?", "Onde sinto que passo dos meus próprios limites?", "Quem ultrapassa minhas fronteiras com frequência?", "Como meu corpo reage quando meu limite é violado?", "Como me sinto quando me imponho?", "O que é “me respeitar” na prática?", "O que eu nunca deveria ter permitido?"] },
    { questions: ["O que eu gostaria de dizer e não digo?", "Por que tenho dificuldade de me posicionar?", "Com quem me sinto mais à vontade para ser assertivo?", "Como posso expressar necessidades sem culpa?", "Que pensamento me impede de me impor?", "Que frase assertiva quero praticar?", "Como posso me comunicar com clareza?"] },
    { questions: ["Quem respeita meus limites?", "Quem exige que eu vá além do possível?", "Que limite eu preciso reforçar?", "Onde preciso me afastar?", "Onde posso me aproximar?", "O que eu permito por medo de perder alguém?", "Quando sinto que me traio?"] },
    { questions: ["O que é não-negociável para mim?", "Que comportamento não aceito mais?", "Como posso proteger minha saúde emocional?", "Que valor meu eu tenho desonrado?", "Onde me senti forte recentemente?", "Onde preciso ser mais firme?", "Que limite representa amor-próprio?"] },
    { questions: ["Qual foi meu maior ato de autorespeito este mês?", "O que aprendi sobre me posicionar?"] }
  ],
  30,
  ["Quais limites ficaram claros?", "Onde preciso reforçar minha voz?", "O que nunca mais aceito?", "Como posso me respeitar mais?"]
));

// --- OUTUBRO ---
monthsData.push(generateMonth(
  10, "Outubro", "Feridas Emocionais e Ressignificação",
  "Olhar para as dores antigas não para sofrer, mas para integrar.",
  "Qual cicatriz minha conta uma história de sobrevivência?",
  "Kintsugi Emocional",
  ["Visualize uma ferida ou dor como um vaso quebrado.", "Imagine preencher as rachaduras com ouro líquido (sabedoria, aprendizado).", "Como essa peça se torna mais valiosa agora?"],
  [
    { questions: ["Quais feridas emocionais reconheço em mim?", "Onde ainda dói?", "O que me machucou profundamente?", "Como essa dor se manifesta no presente?", "De quem eu esperava algo que não veio?", "O que eu perdi e ainda não elaborei?", "Que parte de mim ainda pede cuidado?"] },
    { questions: ["O que esse sofrimento tentou me ensinar?", "Que mecanismos desenvolvi para me proteger?", "O que deixei de viver por causa dessa dor?", "Qual crença nasceu dessa experiência?", "Essa crença ainda é verdadeira?", "O que eu diria para a versão ferida de mim?", "Quem me ajudou nesse processo?"] },
    { questions: ["O que posso reinterpretar com mais maturidade?", "Que significado posso dar a essa experiência hoje?", "O que posso soltar?", "O que ainda preciso acolher?", "Como posso transformar dor em sabedoria?", "Que ganho tive dessa experiência?", "O que posso fazer para seguir adiante?"] },
    { questions: ["Como posso me tratar com mais cuidado?", "O que reforça minha dor — e o que a alivia?", "Quem me apoia emocionalmente?", "Como posso pedir ajuda?", "Como posso honrar minha história sem repetir padrões?", "O que celebraria como cura?", "Que parte minha renasceu depois da dor?"] },
    { questions: ["O que já não dói como antes?", "O que mudou em mim?", "Que nova história quero contar sobre essa ferida?"] }
  ],
  31,
  ["O que curei?", "Que padrões transformei?", "Que dores reconheci?", "Que força surgiu dessa cura?"]
));

// --- NOVEMBRO ---
monthsData.push(generateMonth(
  11, "Novembro", "Propósito, Sentido e Missão Pessoal",
  "Conectar-se com algo maior que si mesmo.",
  "Se minha vida fosse uma mensagem, o que ela diria?",
  "A Linha da Vida",
  ["Desenhe uma linha do tempo do nascimento até hoje.", "Marque os picos (alegrias) e vales (dores).", "Encontre o fio condutor: o que sempre esteve presente? (ex: ajudar, criar, organizar). Isso aponta seu propósito."],
  [
    { questions: ["O que faz minha vida valer a pena?", "Onde encontro sentido?", "O que desperta entusiasmo em mim?", "Onde sinto que estou contribuindo?", "O que me conecta ao mundo?", "O que me faz sentir útil?", "Onde sinto que estou no caminho certo?"] },
    { questions: ["Qual é minha missão nesta fase da vida?", "O que desejo deixar no mundo?", "Que impacto quero gerar?", "Quem quero ajudar?", "Que mensagem minha vida comunica?", "Que talento meu pode servir aos outros?", "O que me impede de viver minha missão?"] },
    { questions: ["Que “voz interna” venho ignorando?", "Como posso escutá-la?", "O que me emociona profundamente?", "Que sonhos deixei para trás?", "O que me faria sentir realizado?", "Que escolha se parece com meu futuro?", "O que minha intuição tenta me dizer?"] },
    { questions: ["Como posso alinhar propósito e rotina?", "O que posso ajustar agora?", "Que meta representa meu propósito?", "Do que preciso abrir mão para avançar?", "Quem me inspira?", "O que minha criança interior sonhava?", "Onde quero estar daqui a cinco anos?"] },
    { questions: ["Que propósito emergiu este mês?", "O que vou nutrir no próximo ano?"] }
  ],
  30,
  ["O que dá sentido à minha vida?", "Que missão descobri?", "O que quero levar adiante?", "Como viver mais coerente com meu propósito?"]
));

// --- DEZEMBRO ---
monthsData.push(generateMonth(
  12, "Dezembro", "Integração, Gratidão e Síntese de Si",
  "Colher os frutos do ano e preparar o terreno para o novo ciclo.",
  "O que eu levo e o que eu deixo?",
  "A Carta de Agradecimento ao Ano",
  ["Escreva uma carta para o ano que passou como se ele fosse uma pessoa.", "Agradeça pelo que foi bom e pelo que foi difícil.", "Despeça-se dele com gratidão."],
  [
    { questions: ["O que mais mudou em mim este ano?", "Que conquista emocional me marcou?", "O que enfrentei com coragem?", "O que deixei para trás?", "Quem me apoiou?", "Onde cresci sem perceber?", "Do que mais me orgulho?"] },
    { questions: ["Pelo que sou grato internamente?", "Qual pessoa foi essencial este ano?", "Que momento pequeno se tornou grande?", "Que hábito transformou meu ano?", "Que dor me ensinou algo?", "Qual presente inesperado a vida me deu?", "O que agradeço a mim mesmo?"] },
    { questions: ["Quem eu me tornei?", "O que definiu meu ano?", "Que crença abandonei?", "Que valor emergiu?", "Como minha história se integrou?", "O que ainda preciso acolher?", "O que quero consolidar no próximo ano?"] },
    { questions: ["O que quero levar para o próximo ciclo?", "O que deixo aqui?", "Qual intenção levo para o ano seguinte?", "Que prática quero manter?", "Que pessoas quero cultivar?", "Como posso começar o próximo ano com leveza?", "Qual palavra define meu novo ciclo?"] },
    { questions: ["Que página interno eu fecho?", "Que capítulo começo?", "Qual frase define meu ano?"] }
  ],
  31,
  ["Quem me tornei após este ano?", "O que quero honrar?", "O que quero transformar no próximo ciclo?", "Qual é minha síntese de mim?"]
));
