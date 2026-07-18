import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { CookieName } from "./type";

export const getCookie = async (
  key: CookieName,
): Promise<RequestCookie | undefined> => {
  const store = await cookies();
  return store.get(key);
};
