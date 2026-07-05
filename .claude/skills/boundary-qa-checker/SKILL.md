---
name: boundary-qa-checker
description: "TMDB 탐색 웹앱에서 구현된 태스크의 통합 정합성을 검증할 때 사용. API 응답 shape와 프론트 훅 타입 교차 비교, 라우팅 정합성, 디자인 토큰 준수, 에러/엣지케이스 정책 준수를 점검한다. 태스크(모듈) 완료 직후, 또는 'QA해줘', '검증해줘', '이거 제대로 붙었는지 확인' 요청 시 사용. 단순 타입체크/린트 실행은 이 스킬 없이 직접 명령 실행으로 충분하다."
---

# Boundary QA Checker

QA 에이전트가 사용하는 스킬. 핵심은 "존재 확인"이 아니라 **교차 비교** — API route와 그 소비자 훅/컴포넌트를 동시에 읽고 계약이 맞는지 본다. `npm run build`가 통과해도 제네릭 캐스팅 때문에 런타임 shape 불일치는 컴파일러가 못 잡는다.

## 왜 태스크 단위로 즉시 실행하는가

전체 구현이 끝난 뒤 한 번에 QA하면 경계면 불일치가 누적되고, 초기 태스크의 shape 문제가 후속 태스크에 그대로 전파된다. 모듈 하나가 끝나는 즉시 검증해야 문제를 그 자리에서 잡는다.

## 검증 절차

### 1. API 응답 shape ↔ 훅 타입

- 대상 route handler의 `NextResponse.json()`에 전달되는 객체의 실제 shape을 코드에서 추출한다.
- 대응하는 훅의 `fetchJson<T>` 또는 `useQuery`/`useInfiniteQuery` 제네릭 `T`를 확인한다.
- shape과 T가 일치하는지, 래핑 여부(`{ items: [...] }`인데 훅이 배열을 기대하지 않는지)를 확인한다.
- snake_case(TMDB 원본 필드)와 camelCase(앱 내부 타입) 간 변환이 일관되게 적용됐는지 확인한다.

### 2. 에러/엣지케이스 정책 준수 (`01_ARCHITECTURE.md §4`)

구현된 태스크에 해당하는 항목만 확인한다:
- 존재하지 않는 id → `notFound()` 호출 여부
- fetch 실패 → 해당 라우트 세그먼트에 `error.tsx` 존재, `reset()` 재시도 제공 여부
- TMDB 429 → Route Handler가 상태코드 그대로 패스스루하는지, 클라이언트 `useQuery`에 `retry: 1`만 설정됐는지(재시도 로직 추가되지 않았는지)
- 데이터 결측(poster/overview/release_date/cast) → 텍스트 필드 대체 문구, 빈 리스트 섹션 숨김 여부
- 무한스크롤 마지막 페이지 → 추가 로딩 UI 없이 조용히 멈추는지

### 3. 라우팅 정합성

- `src/app/` 하위 페이지 파일 경로에서 실제 URL을 추출한다 (route group `(group)`은 URL에서 제거, `[param]`은 동적 세그먼트).
- 코드 내 모든 `href=`, `router.push(`, `redirect(` 값을 수집해 실제 존재하는 페이지 경로와 매칭한다.

### 4. 디자인 토큰 준수

- `03_DESIGN.md`의 색상/타이포/spacing/radius 토큰 표와 컴포넌트의 실제 className/style을 대조한다.
- 토큰에 없는 임의 값(예: `#123456`, `mt-[17px]` 같은 임의 arbitrary value)이 있으면 FIX 대상.

## 판정 기준

| 판정 | 의미 |
|------|------|
| PASS | 위 4개 항목 모두 문제 없음 |
| FIX | 부분 수정으로 해결 가능한 문제 발견 |
| REDO | 접근 자체가 잘못됨 (예: Client Component에서 TMDB 직접 호출) |

## 출력 포맷

`_workspace/03_qa_{task-id}.md`:

```markdown
## {태스크 ID} — 판정: PASS|FIX|REDO

### API↔훅
{일치 | 불일치: 구체적 내용}

### 에러/엣지케이스
{항목별 준수 여부}

### 라우팅
{일치 | 불일치}

### 디자인 토큰
{준수 | 위반 지점}

### 수정 필요 시
- {file}:{line} — {문제} — {수정 방향}
```
