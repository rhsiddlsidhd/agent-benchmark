import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { HTTPError } from "@/types";
import { parseSeoulOpenApiResponse } from "@/utils";
import { SUBWAY_LINE_COLORS, DEFAULT_SUBWAY_LINE_COLOR } from "@/constants";
import { SubwayStationLineInfoResponse } from "@/schemas";
import { NextRequest } from "next/server";

const SERVICE_NAME = "SearchInfoBySubwayNameService";

type SubwayNameSearchRow = {
  STATION_NM: string;
  LINE_NUM: string;
};

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ station: string }> },
): Promise<APIRouteResponse<SubwayStationLineInfoResponse>> => {
  try {
    const { station } = await params;

    const res = await fetch(
      `${process.env.SUBWAY_SEOUL_BASE_URL}/${process.env.SEOUL_PUBLIC_API_KEY}/json/${SERVICE_NAME}/1/50/${encodeURIComponent(station)}/`,
    );
    const json = await res.json();

    const result = parseSeoulOpenApiResponse<SubwayNameSearchRow>(SERVICE_NAME, json);
    if (result.kind === "failure") {
      throw new HTTPError(result.message, 502);
    }

    if (result.rows.length === 0) {
      throw new HTTPError("해당 역을 찾을 수 없습니다.", 404);
    }

    const uniqueLineNames = [...new Set(result.rows.map((row) => row.LINE_NUM))];

    const lines = uniqueLineNames.map((name) => ({
      name,
      color: SUBWAY_LINE_COLORS[name] ?? DEFAULT_SUBWAY_LINE_COLOR,
    }));

    return apiOk({ station, lines });
  } catch (error) {
    return apiFail(error);
  }
};
