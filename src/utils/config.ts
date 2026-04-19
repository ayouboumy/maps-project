export async function getDynamicApiKey(): Promise<string | undefined> {
  // 1. Check for build-time defined environment variable
  const buildTimeKey = process.env.GEMINI_API_KEY;
  if (buildTimeKey && buildTimeKey !== "MY_GEMINI_API_KEY" && buildTimeKey !== "undefined" && buildTimeKey.trim() !== "") {
    return buildTimeKey;
  }

  // 2. Try to fetch from backend (works for Cloud Run / server-side apps)
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const data = await response.json();
      if (data.GEMINI_API_KEY && data.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
        return data.GEMINI_API_KEY;
      }
    }
  } catch (error) {
    // Ignore error, might be a static host like Vercel
  }

  // 3. Ultimate fallback: The key you provided directly
  // This ensures it works on your phone/Vercel even if env vars are missing
  return "AIzaSyCtP0jFOgBbDgOf-trcadiAB1NjSK_UXqw";
}
