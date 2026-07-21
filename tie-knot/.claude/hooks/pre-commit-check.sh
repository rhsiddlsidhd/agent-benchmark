#!/bin/bash
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 1

SEPARATOR="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! npm run lint; then
  echo "" >&2
  echo "$SEPARATOR" >&2
  echo "❌ LINT 실패 — 커밋 차단됨" >&2
  echo "   위 에러를 고친 뒤 다시 커밋하세요." >&2
  echo "$SEPARATOR" >&2
  exit 2
fi

if ! npm run build; then
  echo "" >&2
  echo "$SEPARATOR" >&2
  echo "❌ BUILD 실패 — 커밋 차단됨" >&2
  echo "   위 에러를 고친 뒤 다시 커밋하세요." >&2
  echo "$SEPARATOR" >&2
  exit 2
fi

echo ""
echo "✅ lint+build 통과"
exit 0
