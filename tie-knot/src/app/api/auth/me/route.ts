import { APIRouteResponse, routeSuccess, routeError } from "@/server/boundary";
import { getAuth } from "@/server/services";
import { AuthSessionResponse } from "@/shared/schemas";

export const GET = async (): Promise<
  APIRouteResponse<AuthSessionResponse>
> => {
  try {
    const session = await getAuth();
    return routeSuccess(session);
  } catch (e) {
    return routeError(e);
  }
};
