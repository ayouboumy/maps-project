import { GoogleGenAI, Type } from "@google/genai";
import { useAppStore } from "../store/useAppStore";

function cleanJsonResponse(text: string): string {
  if (!text) return "";
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in Settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function trainSystemOnData(): Promise<boolean> {
  const { mosques, setKnowledgeBase, setAiInsights, setIsTraining, setLastTrainingDate } = useAppStore.getState();
  
  if (mosques.length === 0) return false;

  setIsTraining(true);

  try {
    const ai = getAI();
    // Prepare a summary of the data for analysis
    const dataSummary = mosques.map(m => ({
      type: m.type,
      commune: m.commune,
      services: m.services,
      items: m.items,
      extraDataKeys: Object.keys(m.extraData || {})
    }));

    const prompt = `Analyze this dataset of mosques and extract patterns, logic, and insights. 
    The goal is to build a "Knowledge Base" that remembers the characteristics of the data even if the data itself is deleted.
    
    Data: ${JSON.stringify(dataSummary.slice(0, 50))} (Analyzing first 50 for efficiency)
    
    Return a JSON object with the following structure:
    {
      "commonTypes": ["list of most frequent mosque types"],
      "commonServices": ["list of most frequent services/facilities"],
      "regionalPatterns": {
        "communeName": "A short insight about mosques in this commune"
      },
      "aiInsights": ["3-5 high-level insights about the dataset architecture and logic"]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commonTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
            commonServices: { type: Type.ARRAY, items: { type: Type.STRING } },
            regionalPatterns: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } },
            aiInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["commonTypes", "commonServices", "regionalPatterns", "aiInsights"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    const result = JSON.parse(cleanJsonResponse(jsonStr));

    setKnowledgeBase({
      commonTypes: result.commonTypes || [],
      commonServices: result.commonServices || [],
      regionalPatterns: result.regionalPatterns || {},
      lastAnalysisCount: mosques.length
    });

    setAiInsights(result.aiInsights || []);
    setLastTrainingDate(new Date().toISOString());
    return true;

  } catch (error) {
    console.error("AI Training Error:", error);
    return false;
  } finally {
    setIsTraining(false);
  }
}
