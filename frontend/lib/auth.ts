const KEY = "secretary_secret";

export function getSecret(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) ?? "";
}

export function saveSecret(secret: string): void {
  localStorage.setItem(KEY, secret);
}

export function clearSecret(): void {
  localStorage.removeItem(KEY);
}
