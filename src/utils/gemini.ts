import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../store/useAppStore";

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("To use the AI on a phone or shared URL, you MUST add your own Gemini API Key to the 'Secrets' menu in AI Studio. The 'Free Model' network proxy only works inside the AI Studio editor window.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function translateTerms(terms: string[]): Promise<Record<string, Record<Language, string>>> {
  if (terms.length === 0) return {};
  
  try {
    const ai = await getAI();
    
    // Chunk terms if there are too many to avoid hitting token limits
    const chunkSize = 50;
    const results: Record<string, Record<Language, string>> = {};
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < terms.length; i += chunkSize) {
      const chunk = terms.slice(i, i + chunkSize);
      
      const promise = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert translator specializing in Islamic terminology and architecture. 
The following JSON array contains terms extracted from a French dataset about mosques in Morocco.

Your task:
1. Translate these French terms into English and Arabic.
2. Standardize/Correct the French terms (e.g., "mosquee" -> "Mosquée", "ecole coranique" -> "École coranique").
3. For Arabic, use the most appropriate religious and technical terms (e.g., "salle de prière" -> "قاعة الصلاة", "woudou" -> "مكان الوضوء", "commune" -> "جماعة").
4. If a term is a name of a place or person, keep it as is but transliterate to Arabic if appropriate.

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
                fr: { type: Type.STRING, description: "Standardized French term" },
                ar: { type: Type.STRING, description: "Arabic translation" }
              },
              required: ["originalTerm", "en", "fr", "ar"]
            }
          }
        }
      }).then(response => {
        const jsonStr = response.text || "[]";
        try {
          const parsed = JSON.parse(cleanJsonResponse(jsonStr));
          for (const item of parsed) {
            if (item.originalTerm && item.en && item.fr && item.ar) {
              results[item.originalTerm] = {
                en: item.en,
                fr: item.fr,
                ar: item.ar
              };
            }
          }
        } catch (e) {
          console.error("JSON Parse Error in translateTerms. String length:", jsonStr.length, "Error:", e);
        }
      }).catch(err => {
        console.error("Error translating chunk:", err);
      });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Translation error:", error);
    return {};
  }
}

export interface ColumnMapping {
  id?: string;
  name?: string;
  name_ar?: string;
  name_fr?: string;
  name_en?: string;
  latitude?: string;
  longitude?: string;
  address?: string;
  commune?: string;
  type?: string;
  services?: string;
  items?: string;
  image?: string;
}

export async function mapExcelColumns(headers: string[]): Promise<ColumnMapping> {
  const fallbackMapping: ColumnMapping = {};
  
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const findHeader = (keywords: string[]) => {
    return headers.find((h, i) => {
      const lowerH = lowerHeaders[i];
      return keywords.some(k => lowerH === k || lowerH.startsWith(k + ' ') || lowerH.startsWith(k + '_'));
    });
  };

  fallbackMapping.id = findHeader(['id', 'n°', 'numéro', 'numero', 'code']);
  fallbackMapping.name = findHeader(['nom', 'mosquee', 'mosquée', 'intitulé', 'name']);
  fallbackMapping.name_ar = findHeader(['arabe', 'اسم']);
  fallbackMapping.name_fr = findHeader(['français', 'francais']);
  fallbackMapping.name_en = findHeader(['anglais', 'english']);
  fallbackMapping.latitude = findHeader(['lat', 'latitude', 'gps_y', 'coord_y', 'y', 'coordonnées', 'coordinates', 'gps', 'location', 'position', 'خط العرض', 'عرض', 'احداثيات']);
  fallbackMapping.longitude = findHeader(['long', 'longitude', 'gps_x', 'coord_x', 'x', 'خط الطول', 'طول']);
  fallbackMapping.address = findHeader(['adresse', 'localisation', 'lieu', 'douar', 'quartier', 'rue', 'address']);
  fallbackMapping.commune = findHeader(['commune', 'municipalité', 'جماعة']);
  fallbackMapping.type = findHeader(['type', 'catégorie', 'nature', 'صنف']);
  fallbackMapping.services = findHeader(['services', 'activités', 'prestations', 'خدمات']);
  fallbackMapping.items = findHeader(['équipements', 'installations', 'مرافق', 'items']);
  fallbackMapping.image = findHeader(['image', 'photo', 'url', 'lien']);

  try {
    const ai = await getAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert data analyst. I have an Excel file with the following column headers:
${JSON.stringify(headers)}

Your task is to map these headers to the following standard fields for a mosque database. 
The headers are likely in French as they come from a Moroccan dataset.

Mapping Guide (Standard Field -> Common French equivalents):
- id: ID, N°, Numéro, Code
- name: Nom de la mosquée, Nom, Intitulé, Mosquee
- name_ar: Nom en arabe, الاسم, اسم المسجد
- name_fr: Nom en français
- name_en: Nom en anglais
- latitude: Latitude, Lat, GPS_X, Coord_X, X
- longitude: Longitude, Long, GPS_Y, Coord_Y, Y
- address: Adresse, Localisation, Emplacement, Lieu, Douar, Quartier, Rue, Province, Ville
- commune: Commune, Municipalité, الجماعة
- type: Type, Catégorie, Nature, الصنف
- services: Services, Activités, Prestations, خدمات
- items: Équipements, Installations, المرافق
- image: Image, Photo, URL, Lien image

Instructions:
1. Return a JSON object where the keys are the standard fields and the values are the corresponding headers from the Excel file.
2. Focus ONLY on mapping the ID, Names (ar/fr/en), Position (Latitude/Longitude), Address, Commune, Type, Services, Items, and Image.
3. If a field has no clear match, omit it.
4. Be flexible with case and accents.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            name_ar: { type: Type.STRING },
            name_fr: { type: Type.STRING },
            name_en: { type: Type.STRING },
            latitude: { type: Type.STRING },
            longitude: { type: Type.STRING },
            address: { type: Type.STRING },
            commune: { type: Type.STRING },
            type: { type: Type.STRING },
            services: { type: Type.STRING },
            items: { type: Type.STRING },
            image: { type: Type.STRING }
          }
        }
      }
    });

    const jsonStr = response.text || "{}";
    try {
      const aiMapping = JSON.parse(cleanJsonResponse(jsonStr));
      // Merge AI mapping with fallback mapping (AI takes precedence if it found a value)
      return { ...fallbackMapping, ...Object.fromEntries(Object.entries(aiMapping).filter(([_, v]) => v != null)) };
    } catch (e) {
      console.error("JSON Parse Error in mapExcelColumns. String length:", jsonStr.length, "Error:", e);
      if (jsonStr.startsWith('{') && !jsonStr.endsWith('}')) {
        try { 
          const aiMapping = JSON.parse(jsonStr + '}'); 
          return { ...fallbackMapping, ...Object.fromEntries(Object.entries(aiMapping).filter(([_, v]) => v != null)) };
        } catch {}
      }
      return fallbackMapping;
    }
  } catch (error) {
    console.error("Column mapping error:", error);
    return fallbackMapping;
  }
}
