const path = require("path");
const { z } = require("zod");

// src/schemas/response/*.schema.ts를 그대로 재사용한다 — 응답 shape의 source of truth는
// 앱 코드(src/schemas)이지 이 스크립트가 아니다. Node 네이티브 TS strip(v22.6+)으로 개별
// 파일을 직접 import한다(배럴 index.ts는 타지 않는다 — config.ts side-effect나 `@/` alias를
// 쓰는 request/ 스키마까지 끌려올 수 있어서, alias 없이 자급자족인 response/ 파일만 대상).
const RESPONSE_SCHEMAS_DIR = path.join(__dirname, "../../src/schemas/response");

async function loadDataSchemas() {
  const [auth, banks, coupleInfo, guestbook, kakaomap, premiumFeature, product, subway] =
    await Promise.all([
      import(path.join(RESPONSE_SCHEMAS_DIR, "auth.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "banks.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "coupleInfo.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "guestbook.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "kakaomap.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "premiumFeature.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "product.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "subway.schema.ts")),
    ]);

  return {
    authSession: auth.authSessionResponseSchema,
    banks: banks.banksResponseSchema,
    coupleInfo: coupleInfo.coupleInfoResponseSchema,
    guestbookList: guestbook.guestbookListResponseSchema,
    kakaomap: kakaomap.kakaomapResponseSchema,
    premiumFeatures: premiumFeature.premiumFeaturesResponseSchema,
    products: product.productsResponseSchema,
    subwayStations: subway.subwayStationsResponseSchema,
    subwayLineInfo: subway.subwayStationLineInfoResponseSchema,
  };
}

// --- 공통 envelope (src/types/error.ts: SuccessResponse / ErrorResponse) ---
// 이건 도메인 데이터가 아니라 이 스크립트가 검증할 "응답 봉투" 형태라 여기 둔다.

const errorEnvelope = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.number(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

function successEnvelope(dataSchema) {
  return z.object({ success: z.literal(true), data: dataSchema });
}

// success:true/false가 discriminator라 z.union 대신 z.discriminatedUnion 사용(Zod 공식 권장 — 순차 시도하는
// z.union보다 discriminator 키로 바로 분기해서 더 정확하고 빠름).
function envelopeFor(dataSchema) {
  return z.discriminatedUnion("success", [successEnvelope(dataSchema), errorEnvelope]);
}

module.exports = { loadDataSchemas, envelopeFor, errorEnvelope };
