import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini
// Note: In a real production app, ensure API_KEY is handled securely (e.g. backend proxy)
// For this client-side demo, we rely on the environment variable injection.
const ai = new GoogleGenAI({ apiKey });

export const generateBrainstormIdeas = async (currentNotes: string[]): Promise<string[]> => {
  if (!apiKey) {
    console.error("API Key is missing");
    return ["Please configure your Gemini API Key in the environment."];
  }

  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    I am brainstorming on a whiteboard. 
    Here are the current ideas (sticky notes) I have written down:
    ${JSON.stringify(currentNotes)}

    Based on these, generate 5 NEW, creative, and distinct ideas that related to the theme but offer a fresh perspective.
    Keep each idea short (under 10 words) so they fit on a sticky note.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const parsed = JSON.parse(jsonText);
    return parsed.ideas || [];

  } catch (error) {
    console.error("Error generating ideas:", error);
    return ["Error connecting to AI. Try again."];
  }
};