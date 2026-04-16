import { GoogleGenAI, Type } from "@google/genai";
import { useAppStore } from "../store/useAppStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function trainSystemOnData() {
  const { mosques, setKnowledgeBase, setAiInsights, setIsTraining, setLastTrainingDate } = useAppStore.getState();
  
  if (mosques.length === 0) return;

  setIsTraining(true);

  try {
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
      model: "gemini-3-flash-preview",
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

    const result = JSON.parse(response.text || "{}");

    setKnowledgeBase({
      commonTypes: result.commonTypes || [],
      commonServices: result.commonServices || [],
      regionalPatterns: result.regionalPatterns || {},
      lastAnalysisCount: mosques.length
    });

    setAiInsights(result.aiInsights || []);
    setLastTrainingDate(new Date().toISOString());

  } catch (error) {
    console.error("AI Training Error:", error);
  } finally {
    setIsTraining(false);
  }
}
