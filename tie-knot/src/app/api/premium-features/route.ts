import { apiOk, apiFail, APIRouteResponse } from "@/api/response";
import {
  getAllPremiumFeatureService,
  PremiumFeature,
} from "@/services/premiumFeature.service";

export const GET = async (): Promise<
  APIRouteResponse<{ features: PremiumFeature[] }>
> => {
  try {
    const features = await getAllPremiumFeatureService();

    return apiOk({ features: features ?? [] });
  } catch (error) {
    return apiFail(error);
  }
};
