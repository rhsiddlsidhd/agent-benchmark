import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { getAllSubwayStationNames } from "@/services";
import { SubwayStationsResponse } from "@/schemas";

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
