const KEY_STORAGE_NAME = 'gemini_custom_api_key';

export function getCustomApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEY_STORAGE_NAME) || '';
}

export function setCustomApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(KEY_STORAGE_NAME, key.trim());
  } else {
    localStorage.removeItem(KEY_STORAGE_NAME);
  }
}

export function removeCustomApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_STORAGE_NAME);
}

export function getApiHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const customKey = getCustomApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (customKey) {
    headers['x-custom-api-key'] = customKey;
  }

  return headers;
}
