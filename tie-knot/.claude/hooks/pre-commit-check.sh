#!/bin/bash
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 1

if ! npm run lint; then
  echo "lint 실패, 커밋 차단" >&2
  exit 2
fi

if ! npm run build; then
  echo "build 실패, 커밋 차단" >&2
  exit 2
fi

exit 0
