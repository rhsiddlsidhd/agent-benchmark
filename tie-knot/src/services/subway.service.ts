import { HTTPError } from "@/types";
import { parseSeoulOpenApiResponse } from "@/utils";

const SERVICE_NAME = "SearchSTNBySubwayLineInfo";
// 역 목록은 거의 안 바뀐다 — 저장 시점 검증/드롭다운 둘 다 매 요청마다 799건 외부 API를 다시 안 부르도록 하루 캐시.
const CACHE_REVALIDATE_SECONDS = 60 * 60 * 24;

type SubwayLineInfoRow = {
  STATION_NM: string;
};

export async function getAllSubwayStationNames(): Promise<string[]> {
  const res = await fetch(
    `${process.env.SUBWAY_SEOUL_BASE_URL}/${process.env.SEOUL_PUBLIC_API_KEY}/json/${SERVICE_NAME}/1/1000/`,
    { next: { revalidate: CACHE_REVALIDATE_SECONDS } },
  );
  const json = await res.json();

  const result = parseSeoulOpenApiResponse<SubwayLineInfoRow>(SERVICE_NAME, json);
  if (result.kind === "failure") {
    throw new HTTPError(result.message, 502);
  }

  return [...new Set(result.rows.map((row) => row.STATION_NM))];
}

export async function isValidSubwayStationName(name: string): Promise<boolean> {
  const names = await getAllSubwayStationNames();
  return names.includes(name);
}
