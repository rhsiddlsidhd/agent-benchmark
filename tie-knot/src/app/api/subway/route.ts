import { APIRouteResponse, apiOk, apiFail } from "@/api";
import subwayStations from "@/data/subway.json";
import { SubwayStationsResponse } from "@/schemas";

export const GET = async (): Promise<
  APIRouteResponse<SubwayStationsResponse>
> => {
  try {
    return apiOk(subwayStations);
  } catch (error) {
    return apiFail(error);
  }
};
