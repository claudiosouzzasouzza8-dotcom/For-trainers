import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateExerciseImage(prompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-quality, realistic fitness illustration of a person performing the following exercise: ${prompt}. The style should be professional, clean, and instructional, like a modern fitness app. White background.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

export async function getExerciseExplanation(exerciseName: string, context?: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Explique detalhadamente como realizar o exercício "${exerciseName}". 
      Inclua:
      1. Posição inicial
      2. Execução do movimento
      3. Dicas de respiração
      4. Erros comuns a evitar
      
      Contexto adicional: ${context || "Nenhum"}
      
      Responda em Português (Brasil) de forma motivadora e clara.`,
      config: {
        systemInstruction: "Você é um Personal Trainer especialista em biomecânica e fisiologia do exercício. Sua missão é ensinar exercícios de forma segura e eficiente.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error getting explanation:", error);
    return "Desculpe, não consegui obter a explicação agora.";
  }
}

export const createAIChat = () => {
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "Você é o 'FitAI Coach', um assistente virtual de academia disponível 24/7. Você ajuda usuários com dúvidas sobre treinos, nutrição básica, execução de exercícios e motivação. Seja encorajador, profissional e use termos técnicos de forma acessível.",
    },
  });
};
