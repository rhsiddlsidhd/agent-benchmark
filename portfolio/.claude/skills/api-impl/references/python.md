# api-impl — Python

`requirements.txt`가 확인된 경로에서 HTTP 서비스(API 엔드포인트)를 구현할 때 따르는 절차. FastAPI 등 ASGI 프레임워크 기준.

## 절차 (불변)

1. **계약 확인** — `spec_path` 있으면 그 응답타입/파라미터 그대로 가져다 씀(재정의 금지), 계약 문서 없이 타입 추측 금지
2. **type 정의** — 계약 기준 요청/응답 타입(런타임검증 포함, 예: Pydantic 모델)
3. **service 작성** — 순수 비즈니스 로직. 기존에 같은 데이터소스 다루는 service 있으면 재사용(중복 쿼리/호출 정의 금지)
4. **controller/route 작성** — 요청 파싱(Pydantic 모델로 자동 검증) → service 호출 → 응답 포맷/에러 핸들링(예: `HTTPException`). 시스템 경계(외부 API/DB 호출)라 런타임 검증 적용

## 금지
- 계약 없이 impl 시작(먼저 write-api-spec 스킬로 계약 확정)
- service 로직을 controller/route에 직접 작성(레이어 우회)
- 타입 없이 dict/Any로 요청·응답 주고받기(Pydantic 모델 없이 raw dict 반환 금지)
- 키/시크릿 하드코딩(env var 이름만 참조)
