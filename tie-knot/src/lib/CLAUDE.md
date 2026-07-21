# CLAUDE.md — src/lib/

> Last updated: 2026-07-22

## Scope

- **외부 라이브러리/시스템 경계를 감싸는 코드** — 암호화(bcrypt), 이미지 업로드(cloudinary), 쿠키(cookies), 이메일(nodemailer), 카카오맵(kakao), JWT(jose). 판단 기준은 "npm 패키지를 쓰느냐"가 아니라 **side-effect(I/O)·설정/시크릿 참조·외부 시스템과의 실제 통신 여부**다 — zod처럼 순수 계산만 하는 라이브러리는 npm 패키지여도 `src/utils/` 소관(`validateAndFlatten`이 실제로 여기서 옮겨간 사례, Gotchas 참고).
- **폴더명은 연동 대상 라이브러리/서비스명 그대로 쓴다**(Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`의 lib 2단계 구조 — "개념명"이 아니라 "그 라이브러리 자체의 이름"이 원칙). `bcrypt`/`cloudinary`/`kakao`/`jose`가 이 원칙을 따른다 — JWT를 감싸는 폴더는 실제로 `jose` 패키지를 쓰므로 `token`이 아니라 `jose`, 이메일 발송은 `nodemailer` 패키지를 쓰므로 `email`이 아니라 `nodemailer`. **예외는 두 가지뿐이다**: `cookies/`는 감싸는 대상이 설치형 npm 패키지가 아니라 Next.js 프레임워크 내장 API(`next/headers`의 `cookies()`)라서 "그 라이브러리 이름"에 대응하는 게 없다(`next`라고 하면 프레임워크 전체를 가리키는 셈이라 범위가 안 맞음) — 이 경우 개념명(`cookies`)을 그대로 쓴다. `cn/`은 반대로 라이브러리가 하나가 아니라 둘(`clsx`+`tailwind-merge`)이라 어느 한쪽 이름만 쓰면 왜곡돼서, 이 조합 패턴 자체의 업계 통용 이름(`cn`)을 개념명으로 쓴다.

## Structure

```
src/lib/
├── bcrypt/
│   ├── hash.ts             # hashPassword, comparePasswords — 실제 로직
│   └── index.ts             # 배럴 — export * from "./hash"
├── cloudinary/
│   ├── config.ts          # SDK 초기화
│   ├── upload.ts            # 업로드 함수 — 실제 로직
│   ├── type.ts               # 응답 타입
│   └── index.ts               # 배럴 — export * from "./upload"
├── cn/
│   ├── merge.ts             # cn() — clsx+tailwind-merge 조합, 실제 로직
│   └── index.ts             # 배럴 — export * from "./merge"
└── ...                        # 폴더 1개 = 연동 대상 1개, 파일 개수 무관하게 index.ts는 항상 배럴
```

## Critical Convention

- 새 외부 연동을 기존 폴더에 얹지 않는다 — 폴더 1개당 연동 대상 1개(Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`의 lib 2단계 구조). 파일명에 폴더명(서비스명)을 반복하지 않는다.
- **`index.ts`는 폴더 안 파일 개수와 무관하게 항상 배럴이다 — 실제 로직을 `index.ts`에 직접 두지 않는다.** 파일이 하나뿐이어도 그 파일은 역할명으로 짓고(`bcrypt/hash.ts`, `mongodb/connect.ts`처럼), `index.ts`는 그 파일을 재export하는 배럴로 별도로 둔다(`export * from "./x"`, `src/CLAUDE.md`의 src 공통 배럴 정책과 동일한 모양 — `lib/`은 폴더 1개=서비스 1개라 그 배럴이 서비스별로 여러 개 있을 뿐이다).

## Gotchas

- 2026-07-22, `utils.ts`(flat 파일 예외)가 `cn/merge.ts`로 옮겨졌다 — 소비처 37곳 `@/lib/utils`→`@/lib/cn` 전환, `components.json`의 shadcn CLI 별칭(`aliases.utils`)도 `@/lib/cn`으로 갱신해서 앞으로 `npx shadcn add`가 새 컴포넌트를 생성해도 새 경로로 import하게 맞춰뒀다. `next build`로 검증 완료.
- 이 폴더 전체를 위 두 규칙(폴더명=라이브러리명 그대로, `index.ts`=항상 배럴)에 맞게 정리 완료 — `token/`→`jose/`, `email/`→`nodemailer/` 리네임(+ 오타 파일 `nodemalier.ts`→`send.ts`), `bcrypt/index.ts`→`hash.ts`+배럴, `mongodb/index.ts`→`connect.ts`+배럴, `cloudinary/index.ts`→`upload.ts`+배럴, `kakao/`에도 배럴 추가(`useKakaoLoader.ts`는 React 훅이라 `use` 접두사 이름 그대로 유지, 배럴만 얹음). `cookies/`도 배럴이 없어서 추가. 결과적으로 모든 폴더가 `@/lib/{서비스}` 하나의 경로로만 import된다.
- `validation/validateAndFlatten.ts`는 삭제됐다 — zod만 쓰는 순수 함수(side-effect/시크릿/외부 통신 없음)라 애초에 이 폴더 자격이 없었다. `src/utils/validate-and-flatten.ts`로 이동, 소비처 18곳 전부 `@/utils`로 갱신.
- `cloudinary/config.ts`가 cloudinary SDK를 초기화하지만 실제로는 `upload.ts`가 SDK 대신 REST API를 직접 `fetch`로 호출한다 — `config.ts`를 아무도 import하지 않는 죽은 초기화 코드로 보인다(오늘 건드리지 않음, 확인 필요).

## 관련 문서

- 파일명/식별자 케이스 일반 규칙: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- 순수 함수와의 경계: `src/utils/CLAUDE.md`
- 외부 SDK 초기화 훅 배치 경계(카카오맵 등): `src/CLAUDE.md`
- 배치 경계 상대측: `src/hooks/CLAUDE.md`
