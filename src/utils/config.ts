export async function getDynamicApiKey(): Promise<string | undefined> {
  // If we have a hardcoded key from build time that works, use it (e.g. while in AI Studio)
  const buildTimeKey = process.env.GEMINI_API_KEY;
  if (buildTimeKey && buildTimeKey !== "MY_GEMINI_API_KEY" && buildTimeKey !== "undefined") {
    return buildTimeKey;
  }

  // Otherwise, fetch it from our backend at runtime (for phone/standalone use)
  try {
    const response = await fetch('/api/config');
    const data = await response.json();
    return data.GEMINI_API_KEY;
  } catch (error) {
    console.error("Failed to fetch dynamic API key:", error);
    return undefined;
  }
}
