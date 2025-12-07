import { GoogleGenAI } from "@google/genai";
import { UserData, MonthConfig } from "../types";

// Initialize Gemini Client
// Assumption: process.env.API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMonthSummary = async (
  month: MonthConfig,
  userData: UserData,
  userName: string
): Promise<string> => {
  
  // 1. Gather entries for this month
  const entries = month.days
    .filter(day => !day.isMonthlyReview) // Exclude the review page itself
    .map(day => {
      const answer = userData[day.id];
      if (answer && answer.text.trim().length > 0) {
        return `Dia ${day.dayOfMonth} - Pergunta: "${day.question}"\nResposta: "${answer.text}"\n`;
      }
      return null;
    })
    .filter(Boolean);

  if (entries.length === 0) {
    throw new Error("Não há respostas suficientes neste mês para gerar um resumo.");
  }

  // 2. Construct Prompt
  const prompt = `
    Você é um terapeuta e mentor sábio, empático e perspicaz analisando o diário de ${userName}.
    
    Aqui estão as entradas do diário para o mês de ${month.name}, cujo tema foi "${month.theme}".
    
    ENTRADAS DO USUÁRIO:
    ${entries.join("\n---\n")}
    
    TAREFA:
    Escreva um resumo profundo e acolhedor (máximo 200 palavras) sobre o mês dessa pessoa.
    - Identifique padrões emocionais recorrentes.
    - Destaque uma força ou crescimento que ela demonstrou.
    - Ofereça uma pergunta suave para ela levar para o próximo mês.
    - Use um tom pessoal, direto ("Você...") e encorajador.
    - Não julgue, apenas espelhe com sabedoria.
  `;

  try {
    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o resumo no momento.";
  } catch (error) {
    console.error("Erro ao gerar resumo com IA:", error);
    throw error;
  }
};
