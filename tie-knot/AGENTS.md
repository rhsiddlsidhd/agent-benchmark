<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Git

- TODO.md 정리·갱신은 `docs/todo-section-taxonomy` 브랜치에서 한다. 매 사이클 `git switch -C docs/todo-section-taxonomy origin/dev`로 새로 따고, 머지 후에는 다른 브랜치와 동일하게 삭제한다 — 재사용하는 건 이름뿐이다. 브랜치를 살려두면 squash merge 탓에 매 사이클 dev와 갈라진 상태에서 출발하게 된다.

- 목적 밖 발견의 배출구는 TODO.md의 "미분류 인박스"다 — 작업 브랜치는 여기에만 append한다. 정식 섹션의 재분류·이동·완료 체크는 TODO 브랜치에서만 한다. 이동과 수정이 겹치면 머지가 못 푼다.
