# ROUTE_NAMING

> Last updated: 2026-08-08

새 라우트 세그먼트(폴더명)를 지을 때만 참고한다 — 기존 세그먼트를 일괄 소급 변경하지는 않는다.

## 규칙 4가지

- **소문자 + kebab-case 고정** — camelCase/snake_case 안 씀. 하이픈만 검색엔진이 단어 구분자로 인식한다.
- **명사 위주, 동사는 관용적으로 굳은 것만 예외 허용** — REST 자원 경로는 명사가 기본(`products`, `my-orders`). "행위 자체가 화면"인 경우만 동사/동사구 예외 허용(`login`, `signup`, `search`, `products/new`).
- **약어는 "어휘화(lexicalized)"된 것만 허용** — 기준: 비개발자가 줄임말인 줄 모를 만큼 이미 굳어졌는가. `id`/`api`/`url`/`info`/`faq`는 허용, `pw`/`addr`/`qty`류는 풀스펠링으로 짓는다.
- **복수=컬렉션, 단수=단일 리소스** — 목록/여러 건 다루는 경로(`products`, `users`, `my-orders`)는 복수형, 설정·액션·단일 인스턴스 화면(`my-profile`, `payment`, `dashboard`, `settings`)은 단수형.

## 실제 적용 사례

`/find-id`(허용된 약어 `id`) vs `/find-password`·`/change-password`(원래 `find-pw`/`change-pw`였으나 `pw`가 어휘화 기준 미달이라 개명, `refactor/route-segment-naming` 참고) — 같은 "찾기" 계열 라우트인데 약어 하나(`id`)는 남고 하나(`pw`)는 풀스펠링으로 바뀐 이유가 이 문서의 3번째 규칙(어휘화 기준)이다. 겉으로 드러난 라우트 목록만 보고 패턴을 역추론하면 "왜 id는 되고 pw는 안 되는지" 기준이 안 보인다 — 이 문서가 그 기준(비개발자 인지 여부)을 명시한다.
