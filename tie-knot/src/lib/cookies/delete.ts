import { cookies } from "next/headers";
import { CookieName } from "./type";

export const deleteCookie = async (key: CookieName): Promise<void> => {
  const store = await cookies();
  store.delete(key);
};
