# api-impl — TypeScript

`package.json`이 확인된 경로에서 HTTP 서비스(API 엔드포인트)를 구현할 때 따르는 절차. Vercel 서버리스 함수처럼 파일기반 라우팅 환경이면 controller와 route가 같은 파일이다.

## 절차 (불변)

1. **계약 확인** — `spec_path` 있으면 그 응답타입/파라미터 그대로 가져다 씀(재정의 금지), 계약 문서 없이 타입 추측 금지
2. **type 정의** — 계약 기준 요청/응답 타입(런타임검증 스키마 포함, 예: zod)
3. **service 작성** — 순수 비즈니스 로직. 기존에 같은 데이터소스 다루는 service 있으면 재사용(중복 쿼리/호출 정의 금지)
4. **controller 작성**(파일기반 라우팅이면 route와 같은 파일) — 요청 파싱 → service 호출 → 응답 포맷/에러 핸들링. 시스템 경계(외부 API/DB 호출)라 런타임 검증 적용

## 금지
- 계약 없이 impl 시작(먼저 write-api-spec 스킬로 계약 확정)
- service 로직을 controller에 직접 작성(레이어 우회)
- 타입 대신 `any` 사용
- 키/시크릿 하드코딩(`process.env.X` 참조만)
