import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { CookieName } from "./type";

interface SetCookieArgs {
  value: string;
  name: CookieName;
  maxAge?: number;
  remember?: boolean;
}

export const setCookie = async ({
  name,
  value,
  maxAge,
  remember,
}: SetCookieArgs): Promise<void> => {
  const store = await cookies();

  const baseOption: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  let expirationOptions: Partial<ResponseCookie> = {};

  if (maxAge) {
    expirationOptions = { maxAge };
  } else if (remember) {
    expirationOptions = { maxAge: 7 * 24 * 60 * 60 };
  }

  store.set(name, value, { ...baseOption, ...expirationOptions });
};
