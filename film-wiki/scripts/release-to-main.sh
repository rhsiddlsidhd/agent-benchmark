#!/usr/bin/env bash
# dev → main 릴리스 스크립트.
#
# git의 merge=ours 드라이버는 "양쪽에 존재하고 내용이 다를 때"만 개입하고
# dev에만 있고 main엔 없는 신규 파일(add-only) 케이스는 그냥 통과시켜버려서
# 개발 하네스/도구 파일을 main에서 영구히 배제하는 용도로 쓸 수 없다(dry-run으로 확인됨).
# 대신 매 릴리스마다 병합 스테이징 후 명시적으로 제외 경로를 인덱스에서 빼는 방식으로 대체한다.
#
# 사용법
#   1. dev 브랜치에서, 워킹트리 클린한 상태로 실행: bash scripts/release-to-main.sh
#      (dev 아니거나 dev/main 워킹트리가 지저분하면 스크립트가 바로 종료함)
#   2. 스크립트가 main으로 전환해 dev를 --no-commit으로 병합 스테이징하고,
#      EXCLUDE_PATHS + 전체 CLAUDE.md를 git rm --cached로 뺀 뒤 커밋 직전에 멈춘다
#      (여기서 자동 커밋하지 않는다 — 매번 사람이 눈으로 확인하고 넘어가게 하려는 의도)
#   3. 출력된 git status --short로 제외 대상이 실제로 안 끼었는지 직접 확인
#   4. typecheck/lint/build 등 검증(스크립트가 해주지 않음, 직접 돌려야 함)
#   5. 문제없으면 직접 커밋: git commit -m "release: dev → main"
#   6. 필요하면 직접 push: git push origin main
#
# 새 하네스/도구 경로가 추가되면 EXCLUDE_PATHS 배열에 반영해야 한다(자동 감지 안 됨).
set -euo pipefail

PROJECT_DIR="film-wiki"
EXCLUDE_PATHS=(
  "$PROJECT_DIR/.claude"
  "$PROJECT_DIR/.playwright"
  "$PROJECT_DIR/.vscode"
  "$PROJECT_DIR/TODO.md"
  "$PROJECT_DIR/AGENTS.md"
  "$PROJECT_DIR/docs"
  "$PROJECT_DIR/scripts/release-to-main.sh"
)
# CLAUDE.md는 루트 + src 하위 각 레이어(app/components/lib/hooks/utils/context 등)에
# 흩어져있어 정적 목록 대신 find로 전부 잡는다.

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [[ "$(git branch --show-current)" != "dev" ]]; then
  echo "dev 브랜치에서 실행해야 함" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "dev 워킹트리가 깨끗하지 않음 — 커밋/스태시 먼저" >&2
  exit 1
fi

git checkout main

if [[ -n "$(git status --porcelain)" ]]; then
  echo "main 워킹트리가 깨끗하지 않음" >&2
  exit 1
fi

git merge --no-commit --no-ff dev

for path in "${EXCLUDE_PATHS[@]}"; do
  if [[ -e "$path" ]]; then
    git rm -r --cached --ignore-unmatch "$path" >/dev/null
    rm -rf "$path"
  fi
done

while IFS= read -r -d '' claude_md; do
  git rm --cached --ignore-unmatch "$claude_md" >/dev/null
  rm -f "$claude_md"
done < <(find "$PROJECT_DIR" -name "CLAUDE.md" -print0)

echo
echo "머지 스테이징 완료(아직 커밋 안 됨). 아래 상태 확인 후 직접 커밋하세요:"
echo
git status --short
echo
echo '  git commit -m "release: dev → main"'
echo
echo "커밋 후 push는 별도로 직접 실행하세요."
