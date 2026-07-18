import { apiSuccess, APIRouteResponse } from "@/api/response";
import { handleRouteError } from "@/api/error";
import {
  getAllPremiumFeatureService,
  PremiumFeature,
} from "@/services/premiumFeature.service";

export const GET = async (): Promise<
  APIRouteResponse<{ features: PremiumFeature[] }>
> => {
  try {
    const features = await getAllPremiumFeatureService();

    return apiSuccess({ features: features ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
};
