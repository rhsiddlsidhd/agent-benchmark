import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
import { getAuth } from "@/server/services";
import { AuthSessionResponse } from "@/shared/schemas";

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
