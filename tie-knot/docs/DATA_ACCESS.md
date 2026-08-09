# docs/DATA_ACCESS.md

> Last updated: 2026-07-28
> `src/CLAUDE.md`에서 분리됨.

## 데이터 접근 경로 — 무엇이 필요한가가 기준

"누가 부르는가"가 아니라 "무엇이 필요한가"로 경로가 갈린다 — 브라우저가 트리거해도 mutation은 예외 없이 Server Action으로 간다(아래 2번), route.ts를 거치는 건 캐싱이 필요한 조회뿐이다.

| #   | 필요                                                                       | 경로                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 서버 렌더 시점 데이터(Server Component 렌더링용)                           | `src/server/services/*` 직접 import + 함수 호출 — route.ts 안 거침(같은 프로세스 안에서 굳이 HTTP 왕복 안 만듦)                                                                                   |
| 2   | 브라우저 트리거 mutation(create/update/delete) — 폼이든 이벤트 핸들러든    | Server Action — 폼 밖이면 이벤트 핸들러/`useEffect`를 `startTransition`으로 감싸 호출. route.ts/raw `fetch` 안 거침(Server Action은 브라우저에 함수 참조만 내려가는 RPC라 route.ts 자체가 불필요) |
| 3   | 브라우저가 캐싱/재검증(dedupe, focus·interval revalidate) 필요한 조회(GET) | route.ts + `fetcher`(`useSWR`) — raw `fetch` 안 거침(envelope 파싱/구조화된 에러 정규화가 `fetcher`에 집중)                                                                                       |

- 브라우저가 트리거하는 mutation은 예외 없이 Server Action(row 2)으로 간다 — 클라이언트에 raw `fetch`(및 그 래퍼)를 두지 않는다. 과거 "caller가 Server Action을 못 쓰는 mutation" 예외(외부 연동 등)는 실제 인스턴스가 없어 제거했다 — 외부 결제도 브라우저 SDK 호출만 클라에 남고 검증 mutation은 Server Action이다. 새로 그런 사례가 실제로 생기면 그때 재검토한다(가정만으로 예외 자리를 미리 열어두지 않는다).
