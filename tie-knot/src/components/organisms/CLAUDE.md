# CLAUDE.md — src/components/organisms/

> Last updated: 2026-07-18

## Overview

`organisms/`는 molecules(및/또는 atoms, 다른 organisms)를 조합해 만든, 여러 책임을 묶은 복잡한/뚜렷이 구분되는 화면 섹션을 모아두는 곳이다 — molecules와 동일하게 순수(presentational)해야 하며 도메인 로직·데이터 페칭·Server Actions은 두지 않는다(`src/components/CLAUDE.md` 핵심 원칙 1). 도메인 로직이 필요한 화면은 라우트의 `_components/{Name}.tsx`(컨테이너)가 이 순수 organism을 import해서 props(데이터/핸들러)를 채워 넣는 방식으로 만든다 — 예: `_components/LoginForm.tsx`(컨테이너)가 `organisms/Form.tsx`(순수)에 필드 설정·onSubmit·에러를 props로 전달.

molecules와의 경계는 "완성됐냐"가 아니라 "단순한가 복잡한가"다(핵심 원칙 3, 원본 Atomic Design 기준) — molecule은 단일 책임의 단순 단위, organism은 그런 단순 단위 여러 개(+atom)를 묶어 만든 복잡한 구획이다(예: `BasicInfoForm.tsx` = 필드 여러 개(molecule)를 묶고 제출 로직까지 아우르는 폼 섹션).

## Structure

```
src/components/organisms/
├── index.ts                        # 배럴 — export *
└── {Name}.tsx                        # 완성된 화면 섹션(순수, props 기반)
```

## Critical Convention

- 파일명/export는 PascalCase(Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`).
- 소비자가 라우트 1곳뿐인 organism을 미리 여기로 승격하지 않는다 — 도메인 결합 여부와 무관하게, 순수한 완성품 자체가 2개 이상의 라우트/컨테이너에서 재사용될 때만 여기 둔다(`src/components/CLAUDE.md` 컨테이너 승격 규칙). 유일한 소비자가 라우트가 아니라 이미 공유 중인 다른 organism/molecule이면 이 규칙 대상이 아니다(같은 예외는 `src/components/CLAUDE.md` 참고).
- 여러 도메인 타입을 동시에 다루거나 2곳 이상에서 재사용되는 구현체의 추상 네이밍 규칙은 `src/CLAUDE.md` 참고(이 폴더 전용 규칙 아님, 교차 컨벤션).

## Gotchas

- 2026-07-22, `index.ts` 배럴 추가(소비처 27곳 전환, 형제 파일끼리는 직접 경로 유지). `ProductGrid.tsx`/`BottomActionBar.tsx` 2개 파일에 `"use client"`가 빠져있던 걸 `next build`로 발견해 같이 고쳤다 — 배럴이 형제 전체를 한 그래프로 묶어서 경계 선언 누락이 다른 organism까지 빌드를 깨뜨림(`src/hooks/CLAUDE.md` Gotchas 참고).
- `src/` 전체 default export 금지 규칙(`src/CLAUDE.md`) 정리하며 이 폴더 전체(그리고 molecules/route별 `_components/`)를 named export로 전환 완료 — 소비처 import도 전부 named import로 같이 수정. 이 과정에서 소비자 0곳이던 `Features.tsx`/`Hero.tsx`(내부에서 `index`라는 이름으로 잘못 지어진 컴포넌트였음)를 죽은 코드로 삭제(`BGMPlayer.tsx`/`ShareSection.tsx`/`RelatedTemplates.tsx`와 동일 사유).
- 컨테이너/순수 분리 완료: `LoginForm`, `FindIdForm`, `ForgotPasswordForm`, `SignupForm`, `UpdatePasswordForm`, `CheckoutForm`, `ProductRegistrationForm`, `PremiumFeatureRegistrationForm`, `PremiumFeatureDialog`, `ProductOptions`(+`ProductSummary`) — 각각 `_components/{Name}.tsx`(컨테이너)가 `organisms/{Name}.tsx`(순수)를 감싼다.
- `CoupleInfoForm`은 라우트 2곳(`couple-info/`, `order/edit/`)이 공유하던 컨테이너였다 — 오케스트레이션 로직을 `src/hooks/useCoupleInfoForm.ts`({type}로 분기)로 뽑고, 순수 UI는 `organisms/CoupleInfoFormView.tsx`(2곳 이상 공유라 추상 접미사 `View` 부여)로, 각 라우트는 자기 `_components/CoupleInfoForm.tsx`(얇은 컨테이너, 훅 호출+View 렌더만)를 따로 둔다 — "라우트당 컨테이너 1개" 원칙을 예외 없이 유지.
- `ProductCard`, `ErrorFallback`은 분리 대신 `useRouter().push()`를 `<Link>`/`Button asChild`로 바꿔서 애초에 불순물을 없앴다(`src/components/CLAUDE.md` 핵심 원칙 1의 예외 2) — 컨테이너 자체가 필요 없어짐.
- `AuthButtons`/`UserAccountNav`(`(main)/_components/`로), `GuestbookModal`(`(preview)/_components/`로)은 소비처가 `layout.tsx` 1곳뿐이라 organisms에서 이동 완료 — 더 이상 이 폴더 소속 아님(`src/components/CLAUDE.md` 컨테이너 승격 규칙 참고). `Header`도 같이 이동하면서 소속 없던 `src/components/layout/` 폴더 자체가 없어졌다.
- `ProductTableRowAction`/`ProductTableRowSelect`는 소비자 1곳(`ProductTableRow.tsx`)이라 `admin/products/_components/`로 이동 완료(승격 취소, `molecules/CLAUDE.md`의 단일 소비자 규칙과 동일 사유).
- `ProductThumbnail.tsx`는 실제로는 `molecules/CloudImage.tsx`를 그대로 재export하는 alias였다(Product 도메인 로직 없음) — 이 폴더로 이동 대상이 아니라 삭제 대상이었다. 삭제하고 소비자 전부 `CloudImage` 직접 import로 교체 완료(`src/components/molecules/CLAUDE.md` Gotchas 참고).
- `RelatedTemplates.tsx`는 삭제됐다 — 소비자 0곳(코드베이스 전체에 아무도 import 안 함)이고 내부 로직도 `filtered.map(...)`이 통째로 주석처리된 껍데기였다. `BGMPlayer.tsx`/`ShareSection.tsx`와 동일 사유(죽은 코드).
- `organisms/(preview)/` 폴더는 완전히 없어졌다 — 소비 라우트가 `/preview/[id]` 하나뿐이라 `Header`/`Footer`(main layout) 전례와 동일 사유(`src/components/CLAUDE.md` 핵심 원칙 1)로 통째로 이동했다: organism은 `(preview)/preview/[id]/_components/`로, mapper는 `(preview)/preview/[id]/_utils/`로. 이동 과정에서 mapper 순도 위반 5건도 같이 고쳤다(ad-hoc shadow 타입→`ICoupleInfo` indexed access, raw `IGuestbook[]` 그대로 통과 문제 등). `GuestbookSection`/`InvitationMessage`/`LocationSection`은 그 전에 순수성 위반(organism 내부 store write, geolocation/fetch 직접 호출) 때문에 만들어뒀던 컨테이너/순수 분리 쌍을 이번에 라우트 전용으로 옮기며 다시 한 파일로 합쳤다 — 라우트가 유일한 소유자가 된 이상 분리를 유지할 이유가 없어져서다(`(main)/_components/Header.tsx` 등과 동일 패턴). `ViewContact.tsx`는 소비자가 `GuestbookModal.tsx`(레이아웃 소유)라 `(preview)/_components/`로 이동. 유일하게 소비자가 0곳이던 `BGMPlayer.tsx`/`ShareSection.tsx`는 죽은 코드라 삭제.
- `BankField.tsx`(현재 `molecules/`)는 더 이상 `useBanks()`를 직접 호출하지 않는다(수정 완료) — `banks`를 props로 받고, 실제 호출은 `useCoupleInfoForm` 훅으로 옮겨져 `CoupleInfoFormView`→`CoupleInfoSection`/`ParentsInfoSection`을 거쳐 내려온다. 삭제된 `.docs/05_form_interface_standard.md`가 명시했던 "Field organism 자체 페칭" 패턴은 폐기됐다 — 새 Field도 이 방식(props로만 데이터 수신)을 따른다.
- `fields/` 서브폴더 및 그 안의 6개 파일(`TextField`/`SelectField`/`DateField`/`AddressField`/`ImageField`/`BankField`)은 전부 `molecules/`로 이동 완료 — 더 이상 이 폴더 소속 아님(`src/components/molecules/CLAUDE.md` Gotchas 참고).

## 관련 문서

- 상위 4단계 정의 및 순수성 원칙: `src/components/CLAUDE.md`
- 컨테이너(도메인 로직 담당) 및 승격 규칙: `src/app/CLAUDE.md`
- 조합 재료: `src/components/molecules/CLAUDE.md`
- 추상화 네이밍 규칙: `src/CLAUDE.md`
