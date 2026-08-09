function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not defined`);
  }
  return value;
}

const JWT_SECRET = requireEnv("JWT_SECRET");
const ENTRY_JWT_SECRET = requireEnv("ENTRY_JWT_SECRET");
export const JWT_ENCODED_KEY = new TextEncoder().encode(JWT_SECRET);
export const ENTRY_ENCODED_KEY = new TextEncoder().encode(ENTRY_JWT_SECRET);
