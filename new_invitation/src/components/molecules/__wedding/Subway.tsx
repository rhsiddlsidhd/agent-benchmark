import { createLineColorMap, createSelecedSubwayMap } from "@/utils/subway";
import { useEffect, useState } from "react";

export interface SubwayInfo {
  FR_CODE: string;
  LINE_NUM: string;
  STATION_CD: string;
  STATION_NM: string;
}

export interface SubwayApiResponse {
  SearchInfoBySubwayNameService: {
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    list_total_count: number;
    row: SubwayInfo[];
  };
}

const Subway = ({ station }: { station?: string }) => {
  // 현재 지하철역 데이터가 없음
  const [lineColorMap, setLineColorMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [selectedSubway, setSelectedSubway] = useState<Map<string, string[]>>(
    new Map(),
  );

  const getAllSubway = async (): Promise<SubwayInfo[]> => {
    try {
      const res = await fetch("/subway");

      const { SearchInfoBySubwayNameService } = await res.json();

      switch (SearchInfoBySubwayNameService.RESULT.CODE) {
        case "INFO-200":
        case "INFO-000":
          return SearchInfoBySubwayNameService.row;

        case "INFO-100":
          console.error(
            "인증키 오류",
            SearchInfoBySubwayNameService.RESULT.MESSAGE,
          );
          throw new Error(
            "서비스 이용에 문제가 발생했습니다. 관리자에게 문의하세요.",
          );
        default:
          console.error(
            "Subway API 오류",
            SearchInfoBySubwayNameService.RESULT.MESSAGE,
          );
          throw new Error(
            "일시 적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          );
      }
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "일시 적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      console.error("Error fetching subway data", message);
      return [];
    }
  };

  const getSelectedSubway = async (
    stationName: string,
  ): Promise<SubwayInfo[]> => {
    // Next Proxy 로 우회 요청할 거임
    // 클라이언트측에서 http 요청을 하면 CORS 에러가 남
    // 서버측으로 API 요청 > 서버는 데이터 Res > 해당 데이터를 클라이언트로 전달
    try {
      const res = await fetch(`/subway/${stationName}`);

      if (!res.ok)
        throw new Error(`selected subway proxy failed: ${res.statusText}`);

      const subwayData = await res.json();
      return subwayData.SearchInfoBySubwayNameService.row;
    } catch (e) {
      console.error("Error fetching selected subway data", e);
      return [];
    }
  };

  useEffect(() => {
    if (!station) return;

    const fetchData = async () => {
      try {
        const [allSubwayData, selectedSubwayData] = await Promise.all([
          getAllSubway(),
          getSelectedSubway(station),
        ]);

        const lineData = createLineColorMap(allSubwayData);
        const stationData = createSelecedSubwayMap(selectedSubwayData);

        setLineColorMap(lineData);
        setSelectedSubway(stationData);
      } catch (e) {
        console.error("Error fetching subway data", e);
      }
    };

    fetchData();
  }, [station]);

  if (!station) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold">지하철</p>
      <div className="text-xs text-gray-400">
        {[...selectedSubway].map(([key, value], i) => {
          return (
            <div key={i} className="flex flex-col">
              {value.map((line) => {
                return (
                  <p className="flex items-center gap-1" key={line}>
                    <span
                      style={{
                        backgroundColor:
                          lineColorMap.get(line) || "transparent",
                      }}
                      className={`inline-block aspect-square w-3 rounded-full`}
                    />
                    {line}
                  </p>
                );
              })}
              {key}역 하차
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subway;
