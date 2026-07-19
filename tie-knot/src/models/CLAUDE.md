# CLAUDE.md — src/models/

> Last updated: 2026-07-18
> 이 폴더는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md` 소관 밖(프로젝트 고유 선택) — DB 스키마 계약 레이어.

## Scope

- **Mongoose 스키마 정의 + 그 스키마가 만드는 Document/JSON 타입 + 컴파일된 Model.** 파일 하나에 셋(스키마/타입/모델)이 다 들어간다 — API/도메인 계약 타입(`src/types/`)과는 소유권이 다르다: 여기는 "DB에 실제로 뭐가 저장되는가", `types/`는 "API가 뭘 주고받는가".

## Structure

```
src/models/
├── user.model.ts        # UserRole, BaseUser, IUser, UserModel
├── product.model.ts       # ProductDB, IProduct, ProductJSON, ProductModel
└── ...                     # 도메인당 파일 1개
```

## Critical Convention

- 파일명은 `{도메인}.model.ts`로 고정한다.
- 문서 인터페이스는 **mongoose 공식 권장 패턴**을 따른다 — `Document`를 extends하지 않는 순수 인터페이스(`I{Domain}`)로 정의하고 `Schema<I{Domain}>`/`model<I{Domain}>` 제네릭에 넘긴다. Mongoose가 반환하는 실제 문서 인스턴스는 `HydratedDocument<I{Domain}>`가 `.save()`/`.toJSON()` 등 Document 메서드를 자동으로 얹어주므로, 인터페이스 자체가 `Document`를 extends할 필요 없다(mongoose 공식 문서: "IUser is a document interface... HydratedDocument<IUser> represents a hydrated Mongoose document, with methods, virtuals, and other Mongoose-specific features" — `Document`를 직접 extends하는 방식은 공식 문서가 레거시로 분류함).
- DB 저장 shape과 별도로 API 응답용 JSON shape이 필요하면 서로 구분되는 이름을 쓴다(`ProductJSON`처럼) — 이름이 섞이면 "지금 이게 DB raw인지 API 응답인지" 판단 불가능해짐.
- 개발 환경 HMR로 인한 모델 재컴파일 에러를 피하려면 `(mongoose.models.{Model} as Model<I{Domain}>) || mongoose.model<I{Domain}>(...)` 가드를 쓴다 — **캐스팅을 생략하지 않는다.** `mongoose.models.X`는 타입이 `Model<any>`라, 캐스팅 없이 `mongoose.model<I{Domain}>(...)`과 `||`로 묶으면 두 오버로드 시그니처가 합쳐지면서 TS가 `.find()`/`.findOne()` 등 호출을 전부 "This expression is not callable"로 막는다(실제로 이 문서의 예전 버전이 "캐스팅 없는 `||` 가드가 기본"이라고 잘못 적어놨다가 전수 리팩토링 중 8개 서비스 파일에서 이 에러로 드러남 — 원래 `user.model.ts`가 캐스팅 없이도 동작했던 건 `const X: Model<I{Domain}> = ...`처럼 좌변에 명시 타입 annotation을 달아 같은 효과를 냈기 때문이었다).
- 모델 인스턴스에서 `._id`를 쓰는 곳이 있으면 `I{Domain}`에 `_id: Types.ObjectId`를 명시한다 — `Document`를 안 extend하므로 자동으로 안 붙는다.

## Gotchas

- `coupleInfo.guide.md` — 코드 아니라 "스키마 필드 가이드 + UI 생성 프롬프트" 문서가 이 폴더에 같이 있음. 스키마와 강결합된 사람이 읽는 참고 문서라 여기 둔 것으로 보이나, 다른 모델엔 이런 가이드 문서가 없어 왜 `coupleInfo`만 있는지 불명확 — 새로 만들 때 이 패턴을 다른 모델까지 확대할지는 아직 미정.

## 관련 문서

- API/도메인 계약 타입과의 경계: `src/types/CLAUDE.md`
- 이 모델을 조회/조작하는 비즈니스 로직: `src/services/CLAUDE.md`
