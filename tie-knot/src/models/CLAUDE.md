# CLAUDE.md — src/models/

> Last updated: 2026-07-18
> 이 폴더는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md` 소관 밖(프로젝트 고유 선택) — DB 스키마 계약 레이어.

## Scope

- **Mongoose 스키마 정의 + 그 스키마가 만드는 Document/JSON 타입 + 컴파일된 Model.** 파일 하나에 셋(스키마/타입/모델)이 다 들어간다 — API/도메인 계약 타입(`src/types/`)과는 소유권이 다르다: 여기는 "DB에 실제로 뭐가 저장되는가", `types/`는 "API가 뭘 주고받는가".

## Structure

```
src/models/
├── user.model.ts        # UserRole, BaseUser, UserDocument, User(default export)
├── product.model.ts       # ProductDB, ProductDocument, ProductJSON, ProductModel
├── order.model.ts
├── guestbook.model.ts
├── coupleInfo.model.ts
├── product.feature.model.ts
└── payment.ts             # 파일명 규칙 위반(Gotchas 참고)
```

## Critical Convention

- 파일명은 `{도메인}.model.ts`로 고정한다.
- 문서 인터페이스는 **mongoose 공식 권장 패턴**을 따른다 — `Document`를 extends하지 않는 순수 인터페이스(`I{Domain}`)로 정의하고 `Schema<I{Domain}>`/`model<I{Domain}>` 제네릭에 넘긴다. Mongoose가 반환하는 실제 문서 인스턴스는 `HydratedDocument<I{Domain}>`가 `.save()`/`.toJSON()` 등 Document 메서드를 자동으로 얹어주므로, 인터페이스 자체가 `Document`를 extends할 필요 없다(mongoose 공식 문서: "IUser is a document interface... HydratedDocument<IUser> represents a hydrated Mongoose document, with methods, virtuals, and other Mongoose-specific features" — `Document`를 직접 extends하는 방식은 공식 문서가 레거시로 분류함).
- DB 저장 shape과 별도로 API 응답용 JSON shape이 필요하면 서로 구분되는 이름을 쓴다(`ProductJSON`처럼) — 이름이 섞이면 "지금 이게 DB raw인지 API 응답인지" 판단 불가능해짐.
- 개발 환경 HMR로 인한 모델 재컴파일 에러를 피하려면 `mongoose.models.{Model} || mongoose.model(...)` 가드를 쓴다.

## Gotchas

- `payment.ts` — `{도메인}.model.ts` 규칙 위반(`.model` 없음). `payment.model.ts`로 리네임 대상(코드 리팩토링은 추후 진행 예정).
- 문서 인터페이스가 mongoose 레거시 패턴(`Document`를 직접 extends)을 쓰는 파일 4개 — `user.model.ts`(`UserDocument`), `product.model.ts`(`ProductDocument`), `product.feature.model.ts`(`FeatureDoc`), `payment.ts`(`Payment`). 공식 권장 패턴(순수 인터페이스)을 쓰는 나머지 3개(`order.model.ts`의 `IOrder`, `guestbook.model.ts`의 `IGuestbook`, `coupleInfo.model.ts`의 `ICoupleInfo`)로 리팩토링 대상(추후 진행 예정) — 새 모델은 반드시 `I{Domain}` 순수 인터페이스 스타일로 작성한다.
- 모델 재컴파일 가드가 3가지로 갈림: `mongoose.models.X || mongoose.model(...)`(user/guestbook/coupleInfo/product.feature), `(mongoose.models.X as Model<T>) || mongoose.model(...)`(order/payment — 캐스팅 추가), `product.model.ts`만 조건부 가드 없이 `if (mongoose.models.Product) delete mongoose.models.Product` 후 무조건 재생성. 새 모델 추가 시 아무거나 복붙하지 말고 첫 번째(캐스팅 없는 `||` 가드)를 기본으로 쓴다 — 나머지 통일은 별도 리팩토링.
- `coupleInfo.guide.md` — 코드 아니라 "스키마 필드 가이드 + UI 생성 프롬프트" 문서가 이 폴더에 같이 있음. 스키마와 강결합된 사람이 읽는 참고 문서라 여기 둔 것으로 보이나, 다른 모델엔 이런 가이드 문서가 없어 왜 `coupleInfo`만 있는지 불명확 — 새로 만들 때 이 패턴을 다른 모델까지 확대할지는 아직 미정.
- export 방식도 갈림: `user.model.ts`만 default export(`User`, `Model` 접미사 없음), 나머지 7개는 named export + `{Domain}Model` 접미사(`ProductModel`, `OrderModel` 등). 새 모델은 named export + `{Domain}Model` 접미사(다수 패턴)를 따른다.

## 관련 문서

- API/도메인 계약 타입과의 경계: `src/types/CLAUDE.md`
- 이 모델을 조회/조작하는 비즈니스 로직: `src/services/CLAUDE.md`
