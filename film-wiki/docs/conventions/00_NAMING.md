# 네이밍 컨벤션

`src/app`/`src/components`/`src/lib` 전체에 동일 적용한다.

## 파일명 (아티팩트 타입별)

| 아티팩트         | 케이스                    | 예                  |
| ---------------- | ------------------------- | ------------------- |
| 컴포넌트         | PascalCase                | `PersonLink.tsx`    |
| 훅               | camelCase, `use` 접두사 필수 | `useSearchInfinite.ts` |
| 타입/인터페이스  | PascalCase                | `KeyCrewPerson.ts`  |
| 순수함수/유틸    | camelCase                 | `formatRuntime.ts`  |
| 상수             | camelCase                 | `keyCrewJobs.ts`     |

- 배럴 파일은 위 표와 무관하게 `index.ts`(컴포넌트 배럴은 `index.tsx`)로 고정한다.
- 아티팩트 타입에 케이스를 맞추지 않는다(예: 컴포넌트를 kebab-case로 만들지 않는다) — 파일명만 보고 안에 뭐가 있는지 구분되어야 한다.

## Export 식별자 케이스 (상수)

- 원시 리터럴 고정값(매직 넘버/문자열 대체용)은 SCREAMING_SNAKE_CASE로 export한다.
  예: `export const BLUR_DATA_URL = "..."` (`src/lib/tmdb/images.ts`)
- 구조화된 설정/프리셋 객체(variants, transition 등 필드 여러 개)는 camelCase로 export한다.
  예: `export const cardSpring: Transition = {...}` (`src/lib/motion.ts`)
- 판단 기준: 값 하나로 의미가 끝나면 리터럴(UPPERCASE), 여러 필드를 가진 구조/동작 정의면 프리셋(camelCase).
