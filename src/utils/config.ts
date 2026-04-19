export function saveUserApiKey(key: string) {
  if (key.trim()) {
    localStorage.setItem('GEMINI_API_KEY_OVERRIDE', key.trim());
  } else {
    localStorage.removeItem('GEMINI_API_KEY_OVERRIDE');
  }
}

export function getUserSavedKey(): string | null {
  return localStorage.getItem('GEMINI_API_KEY_OVERRIDE');
}

export async function getDynamicApiKey(): Promise<string | undefined> {
  // 1. Check for localStorage override (highest priority for user convenience)
  const savedKey = getUserSavedKey();
  if (savedKey) return savedKey;

  // 2. Check for USER_GEMINI_KEY override
  const userKey = process.env.USER_GEMINI_KEY;
  if (userKey && userKey.trim() !== "" && userKey !== "undefined") {
    return userKey;
  }

  // 3. Check for system-provided GEMINI_API_KEY
  const systemKey = process.env.GEMINI_API_KEY;
  if (systemKey && systemKey !== "MY_GEMINI_API_KEY" && systemKey !== "undefined" && systemKey.trim() !== "") {
    return systemKey;
  }

  // 4. Try to fetch from backend (handles overrides on phone/stand-alone)
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const data = await response.json();
      if (data.GEMINI_API_KEY && data.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
        return data.GEMINI_API_KEY;
      }
    }
  } catch (error) {
    // Static host or network error
  }

  return undefined;
}
