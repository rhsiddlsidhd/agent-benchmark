import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
import { getAllSubwayStationNames } from "@/server/services";
import { SubwayStationsResponse } from "@/shared/schemas";

export const GET = async (): Promise<
  APIRouteResponse<SubwayStationsResponse>
> => {
  try {
    const stationNames = (await getAllSubwayStationNames()).sort((a, b) =>
      a.localeCompare(b, "ko"),
    );

    const stations: SubwayStationsResponse = stationNames.map((name) => ({
      value: name,
      label: `${name}역`,
    }));

    return apiOk(stations);
  } catch (error) {
    return apiFail(error);
  }
};
