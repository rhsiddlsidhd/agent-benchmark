# CLAUDE.md — src/components/organisms/

> Last updated: 2026-07-18

## Scope

- **molecules(및/또는 atoms, 다른 organisms)를 조합해 만든, 그 자체로 완성돼 바로 쓰이는 화면 섹션.** "완성"이 molecules와의 경계다 — molecule은 뭔가 더 꽂혀야 완성되는 골격인데 반해, organism은 조합이 끝난 상태로 그대로 쓰인다(예: `fields/TextField.tsx` = `FormField`(molecule)+`Input`(atom)이 이미 다 꽂혀서 완성된 입력 필드).
- **순수(presentational)해야 한다 — molecules와 동일 원칙, 예외 없음.** 도메인 로직·데이터 페칭·Server Actions은 organisms에도 두지 않는다(`src/components/CLAUDE.md` 핵심 원칙 1). 도메인 로직이 필요한 화면은 라우트의 `_components/{Name}.tsx`(컨테이너)가 이 순수 organism을 import해서 props(데이터/핸들러)를 채워 넣는 방식으로 만든다 — 예: `_components/LoginForm.tsx`(컨테이너)가 `organisms/Form.tsx`(순수)에 필드 설정·onSubmit·에러를 props로 전달.
- **`fields/` 서브폴더** — `FormField`(molecule) 레이아웃과 atom을 결합해 만든 완성된 입력 필드군(`TextField`, `SelectField`, `DateField` 등). 이것도 순수해야 한다 — 어떤 필드든 값/에러/변경 핸들러를 props로만 받는다.
- **`(preview)/` 서브폴더** — 청첩장 미리보기 화면 전용 organism들. 각 컴포넌트 옆에 동명의 `.mapper.ts`가 짝을 이룬다(예: `HeroSection.tsx`+`heroSection.mapper.ts`) — mapper는 원본 도메인 데이터(DB shape)를 그 organism이 받는 props shape으로 변환하는 순수 함수다. organism 자신은 변환된 최종 props만 받는다(원본 도메인 타입을 직접 받지 않는다) — 이 변환 책임을 organism 안으로 가져오지 않는다.

## Structure

```
src/components/organisms/
├── fields/
│   ├── TextField.tsx        # FormField(molecule)+Input(atom) 조합 완성품
│   ├── SelectField.tsx
│   └── ...
├── (preview)/
│   ├── HeroSection.tsx         # 순수, 변환된 props만 받음
│   ├── heroSection.mapper.ts     # 도메인 데이터 → HeroSection props 변환
│   └── ...                         # 컴포넌트-mapper 페어
└── {Name}.tsx                        # 그 외 완성된 화면 섹션(순수, props 기반)
```

## Critical Convention

- 파일명/export는 PascalCase(Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`) — `fields/` 하위는 `{Type}Field.tsx`(예: `SelectField.tsx`, `BankAccountField.tsx`)로 짓는다.
- 소비자가 1개뿐인 organism을 미리 여기로 승격하지 않는다 — 도메인 결합 여부와 무관하게, 순수한 완성품 자체가 2개 이상의 컨테이너/라우트에서 재사용될 때만 여기 둔다(`src/components/CLAUDE.md` 컨테이너 승격 규칙).
- 여러 도메인 타입을 동시에 다뤄야 하는 organism(예: 검색량+게시글수를 같이 그리는 차트)이 생기면 그중 한 도메인 이름을 그대로 쓰지 않는다 — 그 데이터들을 아우르는 추상 개념명으로 짓는다. 단, 이건 순수 props 레벨에서 "여러 shape을 동시에 받는" 경우에 한하며, 지금 이 폴더는 이미 도메인 자체를 안 받으므로(전부 변환된 순수 props) 해당 사례가 현재는 없다.

## Gotchas

- 지금 `organisms/`에 실제로 있는 대부분(`LoginForm`, `SignupForm`, `CheckoutForm`, `ProductCard` 등)은 `useActionState`/Server Actions/store를 직접 호출하는 **컨테이너 성격**이라 이 문서의 순수성 원칙을 위반한다 — 전체를 컨테이너(`_components/`)+순수 organism으로 분리하는 대규모 리팩토링이 필요하다(추후 진행 예정, 지금은 문서 원칙만 확정). 새로 만드는 것부터 이 원칙을 적용한다.
- `ProductThumbnail.tsx`(현재 `molecules/`에 있음, 소비자 6곳)는 이 폴더로 이동 대상 — Product 도메인에 결합돼있어 molecule 자격이 없다(`src/components/molecules/CLAUDE.md` Gotchas 참고).
- `(preview)/` mapper 패턴은 이번에 처음 문서화된 것이라 기존 8개 페어가 실제로 이 규칙(변환 로직이 전부 mapper 안에 있고 컴포넌트는 순수한지)을 지키는지 전수 검증은 아직 안 함(추후 진행 예정).
- `fields/BankField.tsx`가 실제 위반 사례다 — organism 내부에서 직접 `useBanks()`(SWR로 `/api/banks` 페칭)를 호출해 그 결과를 `BaseSelect`에 주입하고 있다. 삭제된 `.docs/05_form_interface_standard.md`는 이 패턴("Field organism이 자체 데이터 페칭 후 Base molecule에 주입")을 정상으로 명시했었으나, 이 문서로 대체되며 뒤집혔다. 고치는 방향: `BankField.tsx`는 `banks`(옵션 목록)와 변경 핸들러를 props로만 받는 순수 organism으로 남기고, `useBanks()` 호출은 이 필드를 쓰는 컨테이너(예: `CoupleInfoForm` 등을 감싸는 라우트 `_components/`)로 옮긴다(코드 리팩토링은 추후 진행 예정).

## 관련 문서

- 상위 3단계 정의 및 순수성 원칙: `src/components/CLAUDE.md`
- 컨테이너(도메인 로직 담당) 및 승격 규칙: `src/app/CLAUDE.md`
- 조합 재료: `src/components/molecules/CLAUDE.md`
