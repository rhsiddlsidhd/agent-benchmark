// 서울 열린데이터광장 API는 두 가지 응답 shape을 섞어 쓴다 — 성공 시엔 서비스명 키로 한 번 감싸고
// (list_total_count/RESULT/row), 에러거나 결과 0건이면 서비스명 wrapper 없이 RESULT만 bare로 온다.
// 이 차이를 감안 안 하면 파서가 항상 같은 shape을 기대하다 깨진다.
//
// discriminant는 boolean(success: true/false)이 아니라 문자열 리터럴(kind)로 둔다 — 이 프로젝트
// TS 환경에서 boolean 리터럴 discriminant는 narrowing이 안 되는 케이스를 실제로 겪었다(재현 확인됨,
// 문자열 리터럴 discriminant는 정상 동작).
type SeoulOpenApiSuccess<T> = {
  kind: "success";
  totalCount: number;
  rows: T[];
};

type SeoulOpenApiFailure = {
  kind: "failure";
  code: string;
  message: string;
};

export type SeoulOpenApiResult<T> = SeoulOpenApiSuccess<T> | SeoulOpenApiFailure;

// 결과 0건(INFO-200)도 실패가 아니라 "정상, 빈 배열"로 취급한다 — 실제 에러(인증키 무효/파라미터 오류 등)만 실패로 분류한다.
const EMPTY_RESULT_CODE = "INFO-200";

export function parseSeoulOpenApiResponse<T>(
  serviceName: string,
  json: unknown,
): SeoulOpenApiResult<T> {
  const body = json as Record<string, unknown>;
  const service = body[serviceName] as
    | { list_total_count: number; RESULT: { CODE: string; MESSAGE: string }; row?: T[] }
    | undefined;

  if (service) {
    return { kind: "success", totalCount: service.list_total_count, rows: service.row ?? [] };
  }

  const bare = body.RESULT as { CODE: string; MESSAGE: string };

  if (bare?.CODE === EMPTY_RESULT_CODE) {
    return { kind: "success", totalCount: 0, rows: [] };
  }

  return { kind: "failure", code: bare?.CODE ?? "UNKNOWN", message: bare?.MESSAGE ?? "알 수 없는 오류" };
}
