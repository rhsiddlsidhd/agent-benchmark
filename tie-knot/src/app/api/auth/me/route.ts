import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { getAuth } from "@/services/auth.service";
import { AuthSession } from "@/types/auth";

export const GET = async (): Promise<
  APIRouteResponse<AuthSession | null>
> => {
  try {
    const session = await getAuth();
    return apiSuccess(session);
  } catch (e) {
    return handleRouteError(e);
  }
};
