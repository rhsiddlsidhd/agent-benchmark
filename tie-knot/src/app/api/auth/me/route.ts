import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { getAuth } from "@/services";
import { AuthSessionResponse } from "@/schemas";

export const GET = async (): Promise<
  APIRouteResponse<AuthSessionResponse>
> => {
  try {
    const session = await getAuth();
    return apiOk(session);
  } catch (e) {
    return apiFail(e);
  }
};
