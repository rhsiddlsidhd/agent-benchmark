import { SubwayInfo } from "@/components/molecules/__wedding/Subway";

export const createLineColorMap = (data: SubwayInfo[]): Map<string, string> => {
  if (!data) return new Map();
  const setColor = [
    "#263C96",
    "#3CB44A",
    "#F06E00",
    "#3BA5E0",
    "#9850E4",
    "#BF682D",
    "#697215",
    "#E51E6E",
    "#CFA42B",
    "#8B5784",
    "#2673F2",
    "#AED8C5",
    "#08AF7B",
    "#72B4E2",
    "#96710A",
    "#8BC53F",
    "#EBA900",
    "#4E67A5",
    "#A71E31",
    "#77C371",
    "#C6C100",
    "#FF9D27",
    "#F4AB3E",
    "#6F99D0",
  ];
  const newMap = new Map<string, string>();
  const sotredLineData = [...new Set(data.map((item) => item.LINE_NUM).sort())];
  sotredLineData.forEach((lineNum, i) => {
    newMap.set(lineNum, i < setColor.length ? setColor[i] : "#000000");
  });
  return newMap;
};

export const createSelecedSubwayMap = (
  data: SubwayInfo[],
): Map<string, string[]> => {
  if (!data) return new Map();
  const newMap = new Map();
  const __data = data;

  __data.forEach((item) => {
    if (!newMap.has(item.STATION_NM)) newMap.set(item.STATION_NM, []);

    newMap.get(item.STATION_NM).push(item.LINE_NUM);
  });

  return newMap;
};
