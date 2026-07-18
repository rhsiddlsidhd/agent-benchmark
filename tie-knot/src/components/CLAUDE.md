# CLAUDE.md — src/components/

> Last updated: 2026-07-18

## Scope

- **atoms/molecules/organisms 3단계.** Brad Frost의 Atomic Design 원본 5단계(atoms/molecules/organisms/templates/pages) 중 이름 3개만 차용한 이 프로젝트 고유 체계다 — templates/pages 역할은 `src/app/**/layout.tsx`/`page.tsx`가 대신한다(`src/app/CLAUDE.md` 참고). 원본 이론은 출처 제약이나 순수성 제약을 두지 않지만, 이 프로젝트는 아래 두 가지를 독자적으로 추가한다.
- **핵심 원칙 1 — atoms/molecules/organisms 전부 순수(presentational)하다.** 도메인 로직·데이터 페칭·Server Actions을 이 3단계 어디에도 두지 않는다 — props로만 데이터/핸들러를 받는다. 도메인 로직이 필요한 화면은 그 로직을 감싸는 **컨테이너**(`src/app/**/_components/{Name}.tsx`, 라우트 전용)가 순수 organism/molecule을 import해서 props를 채워 넣는 방식으로 만든다.
  - 예: `_components/LoginForm.tsx`(컨테이너 — `useActionState`+`useAuthStore`+`router.push` 처리) → `organisms/Form.tsx`(순수 — props로 필드/핸들러/에러만 받음) import.
  - 컨테이너 승격 규칙은 `src/app/CLAUDE.md`의 `_components/` 규칙과 동일: 소비자 1곳이면 라우트 안에 머문다, 순수 organism/molecule 자체가 2곳 이상에서 재사용되면 그게 공용 자격의 근거다(컨테이너는 라우트 소유로 남아도 무방).
- **핵심 원칙 2 — atoms는 "물리적으로 더 못 쪼개는 단위"가 아니라 "이 프로젝트가 더 안 쪼개기로 한 파운데이션 레이어"다.** shadcn/Radix 산출물은 내부적으로 여러 하위 요소를 묶은 복합 시스템(`sidebar.tsx`, `dialog.tsx` 등)이어도 통째로 atom 취급한다. 커스텀 프리미티브(예: Typography)도 "다른 컴포넌트를 조합하지 않고 그 자체로 완결"되면 atom이다.

## 관련 문서

- Atoms 세부: `src/components/atoms/CLAUDE.md`
- Molecules 세부: `src/components/molecules/CLAUDE.md`
- Organisms 세부: `src/components/organisms/CLAUDE.md`
- 라우트 레이어/컨테이너 승격 규칙: `src/app/CLAUDE.md`
