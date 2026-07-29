import { APIRouteResponse, routeSuccess, routeError } from "@/server/boundary";
import { getAllPremiumFeatureService } from "@/server/services";
import { PremiumFeaturesResponse } from "@/shared/schemas";

export const GET = async (): Promise<
  APIRouteResponse<PremiumFeaturesResponse>
> => {
  try {
    const features = await getAllPremiumFeatureService();

    return routeSuccess({ features: features ?? [] });
  } catch (error) {
    return routeError(error);
  }
};
