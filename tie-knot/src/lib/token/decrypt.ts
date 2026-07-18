import { JWTPayload, jwtVerify, JWTVerifyResult } from "jose";
import { DecryptProps, EncryptProps } from "./type";
import { ENTRY_ENCODED_KEY, JWT_ENCODED_KEY } from "./config";
import { HTTPError } from "@/types/error";

interface ExtractedPayload extends JWTPayload, Omit<EncryptProps, "type"> {}

export async function decrypt(
  args: DecryptProps,
): Promise<JWTVerifyResult<ExtractedPayload>> {
  const { token, type } = args;

  const key = type !== "ENTRY" ? JWT_ENCODED_KEY : ENTRY_ENCODED_KEY;

  try {
    return await jwtVerify<ExtractedPayload>(token, key, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ERR_JWT_EXPIRED"
    ) {
      throw new HTTPError("ERR_JWT_EXPIRED", 401);
    }
    throw error;
  }
}
