// 서울교통공사 등 각 운영기관이 공식 지정한 노선 색상 — API가 안 주는 값이라 고정 lookup map으로 관리.
// LINE_NUM 값은 서울 열린데이터광장 지하철 API(SearchSTNBySubwayLineInfo/SearchInfoBySubwayNameService) 응답 그대로다.
export const SUBWAY_LINE_COLORS: Record<string, string> = {
  "01호선": "#0052A4",
  "02호선": "#00A84D",
  "03호선": "#EF7C1C",
  "04호선": "#00A5DE",
  "05호선": "#996CAC",
  "06호선": "#CD7C2F",
  "07호선": "#747F00",
  "08호선": "#E6186C",
  "09호선": "#BDB092",
  신분당선: "#D4003B",
  공항철도: "#0090D2",
  경의선: "#77C4A3",
  경의중앙선: "#77C4A3",
  수인분당선: "#F5A200",
  경춘선: "#0C8E72",
  경강선: "#003DA5",
  서해선: "#81A914",
  "GTX-A": "#9A6292",
  인천선: "#7CA8D5",
  인천2호선: "#7CA8D5",
  김포도시철도: "#A17E46",
  신림선: "#6789CA",
  우이신설경전철: "#B0CE18",
  용인경전철: "#509F22",
  의정부경전철: "#FDA600",
};

export const DEFAULT_SUBWAY_LINE_COLOR = "#6B7280";
