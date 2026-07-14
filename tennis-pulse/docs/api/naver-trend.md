# API 계약: `/api/naver-trend`

> 대상 요구사항: R1 (`_workspace/00_request.yaml`)
> 상태: 확정 (단, 네이버 실제 응답 검증은 키 발급 후 재확인 필요 — 아래 "미확정/주의" 참조)
> 소유: backend 에이전트 · 물리 위치: `frontend/api/naver-trend.ts` (Vercel 파일기반 라우팅)

## 개요

네이버 데이터랩 검색어트렌드 API를 서버리스 함수로 **프록시**한다. `client_id`/`client_secret`은 서버(서버리스 함수) 환경변수로만 접근하며 프론트에 노출하지 않는다. 프론트는 same-origin `/api/naver-trend`만 호출한다.

프록시는 프론트 친화적 단일 시계열 형태로 **정규화**해 응답한다(네이버 원본 `results[]` 래핑을 벗겨 라인 차트가 바로 소비 가능한 `{ period, ratio }[]`로 반환). R1은 "특정 검색어"(단일 키워드) 조회이므로 계약도 단일 키워드로 고정한다.

---

## 1. 엔드포인트

| 항목 | 값 |
|------|-----|
| Method | `GET` |
| Path | `/api/naver-trend` |
| 인증 | 없음(프론트↔프록시). 프록시→네이버 구간에서만 서버 크레덴셜 사용 |
| 캐시 | 응답 캐시 가능(동일 쿼리 결정적). 구현 시 `Cache-Control` 부여 여부는 backend 재량 |

> **GET 채택 이유**: 조회(read)이고 파라미터가 스칼라 4개뿐이라 쿼리스트링으로 충분하며 캐시/링크 공유에 유리하다. 프록시는 내부적으로 네이버의 `POST https://openapi.naver.com/v1/datalab/search`로 변환해 호출한다(네이버는 POST + JSON body 필수).

---

## 2. 파라미터 (쿼리스트링)

| 이름 | 타입 | 필수 | 제약 / 허용값 | 설명 |
|------|------|------|----------------|------|
| `keyword` | string | 예 | 비어있지 않음, trim 후 length ≥ 1 | 조회할 단일 검색어. 프록시가 네이버 `keywordGroups[0]`(`groupName`=keyword, `keywords`=[keyword])로 매핑 |
| `startDate` | string | 예 | `yyyy-MM-dd`, `>= 2016-01-01` | 조회 시작일(네이버 데이터 제공 하한 2016-01-01) |
| `endDate` | string | 예 | `yyyy-MM-dd`, `>= startDate`, 미래일 금지 | 조회 종료일 |
| `timeUnit` | string(enum) | 예 | `date` \| `week` \| `month` | 구간 단위(일/주/월) |

**검증 규칙(런타임)**
- 4개 모두 미존재/공백 → `400 INVALID_PARAM`
- 날짜 포맷 불일치(정규식 `^\d{4}-\d{2}-\d{2}$` + 실제 유효일자) → `400 INVALID_PARAM`
- `startDate > endDate` → `400 INVALID_PARAM`
- `timeUnit` 이 enum 밖 → `400 INVALID_PARAM`

> R1 범위에 없어 계약에서 제외한 네이버 선택 파라미터: `device`(`pc`|`mo`), `ages`(`1`~`11`), `gender`(`m`|`f`). 추후 세그먼트 필터가 필요하면 이 계약에 옵셔널로 확장(하위호환).

---

## 3. 응답 타입

### 3.1 성공 (`200 OK`, `Content-Type: application/json`)

```ts
// 런타임 검증(zod 등)으로 그대로 옮길 수 있는 형태
type TimeUnit = "date" | "week" | "month";

interface TrendPoint {
  period: string; // yyyy-MM-dd (구간 시작일)
  ratio: number;  // 상대지수 0~100 (구간 중 최댓값이 100인 상대값, 소수 가능)
}

interface NaverTrendResponse {
  keyword: string;
  startDate: string; // yyyy-MM-dd (네이버 에코백)
  endDate: string;   // yyyy-MM-dd
  timeUnit: TimeUnit;
  data: TrendPoint[]; // 시간 오름차순, 라인 차트 x=period / y=ratio
}
```

**정규화 규칙**: 네이버 원본 응답의 `results[0].data`를 꺼내 `data`로 그대로 매핑한다(단일 키워드이므로 `results` 길이는 1). `keyword`/`startDate`/`endDate`/`timeUnit`은 요청값(네이버 에코백과 동일)을 반영한다. 검색량이 0인 구간은 네이버가 해당 `period`를 아예 생략할 수 있음 — 프록시는 네이버가 준 배열을 그대로 전달하며 빈 구간 보간은 하지 않는다(프론트가 필요 시 처리).

### 3.2 에러 (JSON, 일관된 shape)

```ts
interface ApiError {
  error: {
    code:
      | "INVALID_PARAM"    // 400: 파라미터 검증 실패
      | "UPSTREAM_ERROR"   // 502: 네이버가 4xx/5xx 반환(설정/키/쿼리 문제 등)
      | "RATE_LIMITED"     // 429: 네이버 호출 한도 초과(원본 상태 전파)
      | "INTERNAL";        // 500: 프록시 내부 예외
    message: string;       // 사람이 읽을 설명(네이버 원문 메시지 포함 가능)
  };
}
```

| HTTP status | `error.code` | 발생 조건 |
|-------------|--------------|-----------|
| 400 | `INVALID_PARAM` | 위 검증 규칙 위반 |
| 429 | `RATE_LIMITED` | 네이버가 429(호출 한도 초과) 반환 시 상태/의미 전파 |
| 502 | `UPSTREAM_ERROR` | 네이버가 그 외 4xx/5xx(잘못된 크레덴셜, 잘못된 요청 등) 반환 |
| 500 | `INTERNAL` | 네트워크 실패·JSON 파싱 실패 등 프록시 내부 오류 |

> 에러를 삼키지 않는다: 네이버 upstream 실패 시 네이버가 준 `errorCode`/`errorMessage`를 `message`에 포함해 로깅·전파한다(키/시크릿 값은 절대 로그/응답에 넣지 않음).

---

## 4. 예시

### 4.1 요청

```
GET /api/naver-trend?keyword=조코비치&startDate=2024-01-01&endDate=2024-06-30&timeUnit=month
```

프록시가 네이버로 변환하는 내부 요청(참고용):

```
POST https://openapi.naver.com/v1/datalab/search
Headers:
  X-Naver-Client-Id: <NAVER_CLIENT_ID>       # env, 응답/로그에 노출 금지
  X-Naver-Client-Secret: <NAVER_CLIENT_SECRET>
  Content-Type: application/json
Body:
{
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "timeUnit": "month",
  "keywordGroups": [
    { "groupName": "조코비치", "keywords": ["조코비치"] }
  ]
}
```

### 4.2 성공 응답 (`200`)

```json
{
  "keyword": "조코비치",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "timeUnit": "month",
  "data": [
    { "period": "2024-01-01", "ratio": 42.13 },
    { "period": "2024-02-01", "ratio": 55.7 },
    { "period": "2024-03-01", "ratio": 38.0 },
    { "period": "2024-04-01", "ratio": 61.24 },
    { "period": "2024-05-01", "ratio": 100 },
    { "period": "2024-06-01", "ratio": 77.9 }
  ]
}
```

### 4.3 에러 응답 예시

```json
// 400 — timeUnit 잘못됨
{ "error": { "code": "INVALID_PARAM", "message": "timeUnit must be one of: date, week, month" } }
```

```json
// 502 — 네이버 인증 실패 전파
{ "error": { "code": "UPSTREAM_ERROR", "message": "naver: NotExist Client ID (errorCode 024)" } }
```

```json
// 429 — 네이버 호출 한도 초과
{ "error": { "code": "RATE_LIMITED", "message": "naver: Rate limit exceeded" } }
```

---

## 5. 외부 설정 필요사항 (키/용도만 — 발급·값은 사용자 몫)

| env var | 용도 | 노출 범위 |
|---------|------|-----------|
| `NAVER_CLIENT_ID` | 네이버 데이터랩 API `X-Naver-Client-Id` 헤더 | 서버(서버리스 함수) 전용 |
| `NAVER_CLIENT_SECRET` | 네이버 데이터랩 API `X-Naver-Client-Secret` 헤더 | 서버(서버리스 함수) 전용 |

- **`VITE_` 접두사 금지** — 클라이언트 번들에 노출된다. 두 값 모두 서버리스 함수 런타임 환경변수로만 주입한다.
- 네이버 애플리케이션에서 "데이터랩(검색어트렌드)" API 사용 설정이 필요(콘솔 작업, 사용자 몫).

---

## 6. 미확정 / 주의

- **`ratio` 타입**: 공식(ncloud) 문서 표기는 `Integer`이나 실제 네이버 응답은 소수(예: `11.05`)를 반환한다 — 계약은 `number`(float 허용)로 확정. 키 발급 후 실응답으로 재확인 필요.
- **네이버 에러 shape**: 데이터랩 문서에 에러 응답 형식/코드 표가 명시돼 있지 않다. 네이버 오픈 API 공통 에러(`errorCode`/`errorMessage`, 예: `024` 인증 실패, 한도 초과 등)를 프록시가 받아 위 `ApiError`로 매핑하는 것으로 확정하되, 정확한 코드·메시지 매핑은 키 발급 후 실호출로 검증 필요.
- **빈 구간 처리**: 검색량이 없는 구간을 네이버가 생략하는지 0으로 채우는지는 실응답 확인 전까지 단정하지 않는다 — 프록시는 원본 배열을 무가공 전달한다.

## 지식 소스

- 네이버 데이터랩 검색어트렌드 공식 문서: https://developers.naver.com/docs/serviceapi/datalab/search/search.md
- NCloud 미러(파라미터/응답 필드 표): https://api.ncloud-docs.com/docs/ai-naver-searchtrend-search
