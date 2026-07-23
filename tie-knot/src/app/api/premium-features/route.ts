import { apiOk, apiFail, APIRouteResponse } from "@/server/response";
import { getAllPremiumFeatureService } from "@/server/services";
import { PremiumFeaturesResponse } from "@/shared/schemas";

export const GET = async (): Promise<
  APIRouteResponse<PremiumFeaturesResponse>
> => {
  try {
    const features = await getAllPremiumFeatureService();

    return apiOk({ features: features ?? [] });
  } catch (error) {
    return apiFail(error);
  }
};
