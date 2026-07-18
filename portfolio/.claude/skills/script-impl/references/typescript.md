# script-impl — TypeScript/Node

`package.json`이 확인된 경로에서 스크립트/배치 작업을 구현할 때 따르는 절차.

## 절차 (불변)

1. **type 정의** — 이 도메인이 다루는 데이터 구조 타입 먼저 작성(`any`/loose object 금지)
2. **service 작성** — 순수 로직 + 외부 I/O(네트워크/파일 등)를 처리하는 **시스템 경계**. 여기서 실패 시 구체 에러 타입(예: `class {Domain}Error extends Error`) 직접 throw — 삼키거나 catch-all로 뭉개지 않음
3. **entrypoint는 로깅 + 실패신호 전파만** — 판단/fallback 로직 넣지 않음, service가 throw한 에러를 그대로 위로 전파(또는 로깅 후 재throw)

## 금지
- service 에러를 entrypoint에서 삼키거나 catch-all로 덮기
- service 로직을 entrypoint에 직접 작성(레이어 우회)
- 타입 없이 `any`/loose object로 데이터 주고받기
