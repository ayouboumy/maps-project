import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../store/useAppStore";

export async function translateTerms(terms: string[]): Promise<Record<string, Record<Language, string>>> {
  if (terms.length === 0) return {};
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No Gemini API key found. Skipping intelligent translation.");
      return {};
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Chunk terms if there are too many to avoid hitting token limits
    const chunkSize = 50;
    const results: Record<string, Record<Language, string>> = {};
    
    for (let i = 0; i < terms.length; i += chunkSize) {
      const chunk = terms.slice(i, i + chunkSize);
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert translator. The following JSON array contains terms extracted from a French dataset about mosques, their facilities, and location data.
        
Your task is to translate these French terms into English, French (correcting typos and standardizing), and Arabic.
- The source terms are in French.
- Provide accurate translations in the context of Islamic terminology and architecture.
- For Arabic, use proper Arabic terms for mosque facilities (e.g., "salle de prière" -> "قاعة الصلاة", "woudou" -> "مكان الوضوء").
        
Terms to translate:
${JSON.stringify(chunk)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalTerm: { type: Type.STRING, description: "The exact original French term provided" },
                en: { type: Type.STRING, description: "English translation" },
                fr: { type: Type.STRING, description: "Corrected/Standardized French term" },
                ar: { type: Type.STRING, description: "Arabic translation" }
              },
              required: ["originalTerm", "en", "fr", "ar"]
            }
          }
        }
      });
      
      const jsonStr = response.text?.trim() || "[]";
      const parsed = JSON.parse(jsonStr);
      
      for (const item of parsed) {
        if (item.originalTerm && item.en && item.fr && item.ar) {
          results[item.originalTerm] = {
            en: item.en,
            fr: item.fr,
            ar: item.ar
          };
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error("Translation error:", error);
    return {};
  }
}
