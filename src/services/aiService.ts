import { GoogleGenAI, Type } from "@google/genai";
import { useAppStore } from "../store/useAppStore";
import { getDynamicApiKey } from "../utils/config";

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

async function getAI() {
  if (!aiInstance) {
    const apiKey = await getDynamicApiKey();
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("To use the AI on a phone or shared URL, you MUST add your own Gemini API Key to the 'Secrets' menu in AI Studio. The 'Free Model' network proxy only works inside the AI Studio editor window.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function trainSystemOnData(): Promise<{success: boolean, error?: string}> {
  const { mosques, setKnowledgeBase, setAiInsights, setIsTraining, setLastTrainingDate } = useAppStore.getState();
  
  if (mosques.length === 0) return { success: false, error: "No mosques found to analyze" };

  setIsTraining(true);

  try {
    const ai = await getAI();
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
      "regionalPatterns": [
        { "communeName": "Name of commune", "insight": "A short insight about mosques in this commune" }
      ],
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
            regionalPatterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  communeName: { type: Type.STRING },
                  insight: { type: Type.STRING }
                },
                required: ["communeName", "insight"]
              }
            },
            aiInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["commonTypes", "commonServices", "regionalPatterns", "aiInsights"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    const result = JSON.parse(cleanJsonResponse(jsonStr));

    // Convert regionalPatterns from array to Record
    const regionalPatternsRecord: Record<string, string> = {};
    if (Array.isArray(result.regionalPatterns)) {
      result.regionalPatterns.forEach((p: any) => {
        if (p?.communeName && p?.insight) {
          regionalPatternsRecord[p.communeName] = p.insight;
        }
      });
    }

    setKnowledgeBase({
      commonTypes: result.commonTypes || [],
      commonServices: result.commonServices || [],
      regionalPatterns: regionalPatternsRecord,
      lastAnalysisCount: mosques.length
    });

    setAiInsights(result.aiInsights || []);
    setLastTrainingDate(new Date().toISOString());
    return { success: true };

  } catch (error: any) {
    console.error("AI Training Error:", error);
    return { success: false, error: error?.message || String(error) };
  } finally {
    setIsTraining(false);
  }
}

/**
 * Smart Semantic Search
 * Uses AI to understand the user's natural language query and filter mosques.
 */
export async function smartSearchMosques(query: string, mosques: any[]): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    const ai = await getAI();
    
    // Send a condensed list to avoid token limits
    const searchableData = mosques.map(m => ({
      id: m.id,
      name: m.name,
      commune: m.commune,
      type: m.type,
      services: m.services,
      items: m.items,
      extra: Object.keys(m.extraData || {}).slice(0, 10) // Just keys to help AI understand schema
    }));

    // We only process the top matches by relevance if the list is huge, 
    // but for 680 mosques we might need to be careful. 
    // Let's analyze top 150 for this call or ask for keyword priorities.
    const prompt = `You are an intelligent search assistant for a Moroccan mosque database.
    User Query: "${query}"
    
    Data (First 150 mosques): ${JSON.stringify(searchableData.slice(0, 150))}
    
    Return a JSON array of the IDs of the mosques that best match the query. 
    Consider synonyms (e.g. "big" -> "Grand", "school" -> "école coranique").
    Return ONLY the array of IDs like ["id1", "id2"].`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const result = JSON.parse(cleanJsonResponse(response.text || "[]"));
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Smart Search Error:", error);
    return [];
  }
}

/**
 * Smart Recommendations
 * Finds mosques that are philosophically or structurally similar.
 */
export async function getRecommendSimilar(targetMosque: any, allMosques: any[]): Promise<string[]> {
  try {
    const ai = await getAI();
    
    const prompt = `Target Mosque: ${JSON.stringify({
      name: targetMosque.name,
      type: targetMosque.type,
      services: targetMosque.services,
      items: targetMosque.items,
      commune: targetMosque.commune
    })}
    
    Database Sample: ${JSON.stringify(allMosques.filter(m => m.id !== targetMosque.id).slice(0, 50))}
    
    Find 3-5 mosques from the sample that are most similar to the target or offer complementary services.
    Return a JSON array of their IDs.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const result = JSON.parse(cleanJsonResponse(response.text || "[]"));
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return [];
  }
}
