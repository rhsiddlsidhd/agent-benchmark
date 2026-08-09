// GET류 라우트만 대상 — 좋아요 토글/결제 동기화/주문 생성/서명 발급 등 부작용 있는 POST/DELETE는 제외.
function buildChecks(env) {
  const infoId = env.NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID;

  return [
    {
      name: "auth/me",
      method: "GET",
      path: "/api/auth/me",
      auth: false,
      schemaKey: "authSession",
    },
    {
      name: "banks",
      method: "GET",
      path: "/api/banks",
      auth: false,
      schemaKey: "banks",
    },
    {
      name: "couple-info",
      method: "GET",
      path: `/api/couple-info?q=${infoId}`,
      auth: true,
      schemaKey: "coupleInfo",
      note: "NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID 사용, requireAuth() 라우트",
    },
    {
      name: "guestbook",
      method: "GET",
      path: `/api/guestbook?id=${infoId}`,
      auth: false,
      schemaKey: "guestbookList",
      note: "NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID를 coupleInfoId로 사용, 응답 스키마가 z.strictObject라 password 등 미정의 필드 새면 SCHEMA_MISMATCH로 잡힘",
    },
    {
      name: "kakaomap",
      method: "GET",
      path: `/api/kakaomap?address=${encodeURIComponent("서울특별시 강남구 테헤란로")}`,
      auth: false,
      schemaKey: "kakaomap",
      note: "실제 카카오 로컬 API로 나감 (KAKAO_REST_API_KEY 소모)",
    },
    {
      name: "premium-features",
      method: "GET",
      path: "/api/premium-features",
      auth: false,
      schemaKey: "premiumFeatures",
    },
    {
      name: "products (전체)",
      method: "GET",
      path: "/api/products",
      auth: false,
      schemaKey: "products",
    },
    {
      name: "products (category=invitation)",
      method: "GET",
      path: "/api/products?category=invitation",
      auth: false,
      schemaKey: "products",
    },
    {
      name: "subway",
      method: "GET",
      path: "/api/subway",
      auth: false,
      schemaKey: "subwayStations",
      note: "서울 열린데이터광장 SearchSTNBySubwayLineInfo 실제 호출 (SEOUL_PUBLIC_API_KEY 소모)",
    },
    {
      name: "subway/[station]",
      method: "GET",
      path: `/api/subway/${encodeURIComponent("강남")}`,
      auth: false,
      schemaKey: "subwayLineInfo",
      note: "서울 열린데이터광장 SearchInfoBySubwayNameService 실제 호출, 환승역(2호선+신분당선) 검증",
    },
  ];
}

module.exports = { buildChecks };
