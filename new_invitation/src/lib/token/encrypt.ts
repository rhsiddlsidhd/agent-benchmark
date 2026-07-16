import { SignJWT } from "jose";
import { EncryptProps } from "./type";
import { ENTRY_ENCODED_KEY, JWT_ENCODED_KEY } from "./config";

export async function encrypt(payload: EncryptProps) {
  return await new SignJWT({
    id:
      payload.type !== "ENTRY"
        ? payload.id
        : payload.type === "ENTRY" && payload.id
          ? payload.id
          : "entryToken",
    role: payload.type !== "ENTRY" ? payload.role : undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.type !== "REFRESH" ? "30m" : "7d")
    .sign(payload.type !== "ENTRY" ? JWT_ENCODED_KEY : ENTRY_ENCODED_KEY);
}
