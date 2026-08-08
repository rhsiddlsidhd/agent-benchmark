<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Git

- `docs/todo-section-taxonomy`는 고정 브랜치다 — TODO.md 정리·갱신 전용이며 PR 머지 후에도 로컬/원격 브랜치를 삭제하지 않는다. TODO 갱신은 1회성 작업이 아니라 반복 사이클이라서다.

- 이 브랜치는 다음 사이클 착수 시 `git fetch origin && git merge origin/dev`로 최신화한다. 전역 GIT.md의 "default 브랜치를 task 브랜치에 merge 금지"는 이 브랜치에 적용하지 않는다. 그 규칙의 근거 넷이 모두 성립하지 않기 때문이다 — 커밋 단위 리뷰(리뷰 대상은 사이클별 TODO diff지 커밋 흐름이 아님), 충돌 해결 추적(결과 문서 자체가 리뷰 대상), 최신 base 위 동작 검증(문서라 빌드·테스트가 없음), 동기화 최소화(설계상 매 사이클 동기화가 필수). 대안인 rebase는 squash merge 탓에 이미 dev에 반영된 변경을 중복 replay해서 쓸 수 없고, merge는 fast-forward push가 되므로 force-push와 히스토리 폐기를 둘 다 피한다.

- 목적 밖 발견의 배출구는 TODO.md의 "미분류 인박스"다 — 작업 브랜치는 여기에만 append한다. 정식 섹션의 재분류·이동·완료 체크는 이 고정 브랜치에서만 한다. 이동과 수정이 겹치면 머지가 못 푼다.
