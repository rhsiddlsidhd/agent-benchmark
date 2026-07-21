import { APIRouteResponse, apiOk, apiFail } from "@/api";
import subwayStations from "@/data/subway.json";

export const GET = async (): Promise<
  APIRouteResponse<typeof subwayStations>
> => {
  try {
    return apiOk(subwayStations);
  } catch (error) {
    return apiFail(error);
  }
};
