import { apiOk, apiFail, APIRouteResponse } from "@/api";
import { getAllPremiumFeatureService } from "@/services";
import { PremiumFeaturesResponse } from "@/schemas";

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
