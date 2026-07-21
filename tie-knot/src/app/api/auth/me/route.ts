import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { getAuth } from "@/services";
import { AuthSession } from "@/types";

export const GET = async (): Promise<
  APIRouteResponse<AuthSession | null>
> => {
  try {
    const session = await getAuth();
    return apiOk(session);
  } catch (e) {
    return apiFail(e);
  }
};
