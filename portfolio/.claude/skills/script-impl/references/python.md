# script-impl — Python

`requirements.txt`가 확인된 경로에서 스크립트/배치 작업을 구현할 때 따르는 절차.

## 절차 (불변)

1. **type 정의** — 이 도메인이 다루는 데이터 구조 타입 먼저 작성(loose dict/anonymous 타입 금지)
2. **service 작성** — 순수 로직 + 외부 I/O(네트워크/파일 등)를 처리하는 **시스템 경계**. 여기서 실패 시 구체 예외 타입(예: `{Domain}Error`) 직접 raise — 삼키거나 broad exception으로 뭉개지 않음
3. **entrypoint는 로깅 + 실패신호 전파만** — 판단/fallback 로직 넣지 않음, service가 raise한 예외를 그대로 위로 전파(또는 로깅 후 재raise)

## 금지
- service 예외를 entrypoint에서 삼키거나 catch-all로 덮기
- service 로직을 entrypoint에 직접 작성(레이어 우회)
- 타입 없이 dict/Any로 데이터 주고받기
