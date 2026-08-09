# CLAUDE.md — src/server/models/

> Last updated: 2026-07-26
> 이 폴더는 프로젝트 고유 선택 — DB 스키마 계약 레이어.

## Overview

`models/`는 Mongoose 스키마 정의 + 그 스키마가 만드는 Document/JSON 타입 + 컴파일된 Model을 모아둔다 — 파일 하나에 셋(스키마/타입/모델)이 다 들어간다. API/도메인 계약 타입(`src/shared/types/`)과는 소유권이 다르다: 여기는 "DB에 실제로 뭐가 저장되는가", `types/`는 "API가 뭘 주고받는가".

## Structure

```
src/server/models/
├── index.ts               # 배럴 — export *
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
- 스키마 옵션에 `{ timestamps: true }`를 쓰면 인터페이스에 `createdAt`/`updatedAt` 둘 다 선언한다 — mongoose가 이 옵션으로 두 필드를 다 만드는데 인터페이스에 하나만 선언하면 실제 DB 문서와 타입이 어긋난다.
- **모델 파일(`*.model.ts`)의 pre/post 훅(미들웨어)에 도메인 계산·비즈니스 규칙을 두지 않는다** — 훅은 그 문서 자체의 형태를 다루는 관심사(필드 정규화, 캐스팅 보정 등)에 한정한다. 가격 계산 같은 도메인 로직은 `services/`가 소유한다(`src/server/services/CLAUDE.md` Overview: "DB 접근 + 비즈니스 로직"). 위반하면 그 로직이 mongoose 생명주기에 암묵적으로 종속된다 — `pre('save')` 훅은 `save()`에서만 발화하고 `updateOne()`/`findOneAndUpdate()`에선 발화하지 않는다(mongoose 공식 문서: "Pre and post save() hooks are not executed on update(), findOneAndUpdate(), etc."), 그래서 같은 문서를 다른 경로로 수정하는 순간 로직이 조용히 스킵된다.
- ObjectId→string 변환을 스키마 `toJSON` transform에 두지 않는다 — `.lean()` 결과엔 스키마 `toJSON` 옵션이 적용되지 않는다(mongoose 공식문서: lean 쿼리는 Document를 생성하지 않아 `.toJSON()`이 없음). 읽기 경로 기본값이 `.lean()`인데(`services/CLAUDE.md`) 모델 transform은 hydrated Document 경로에만 적용돼 커버리지가 갈린다. 변환은 services에서 명시적으로 한다.
- **한 컬렉션 안에서 도메인 하위 타입별로 전용 필드가 생기면 mongoose discriminator로 분리한다** — 모든 하위 타입의 필드를 base 스키마에 평평하게 얹지 않는다(`product.model.ts`의 `previewUrl`이 실제 사례: invitation 전용 개념인데 원래 base에 있었다). 이미 그 하위 타입을 구분하는 필드가 base 스키마에 있으면(`product.model.ts`의 `category`처럼) 새 판별 필드를 만들지 않고 그 필드를 `discriminatorKey` 옵션으로 재사용한다 — mongoose가 discriminatorKey 경로가 이미 정의돼 있으면 그대로 재사용한다(공식 구현: `Model.discriminator()`가 `model.schema.path(key)`를 먼저 확인해 기존 path가 있으면 그걸 쓴다). discriminator 이름은 그 필드가 실제로 갖는 값과 동일하게 짓는다(`ProductModel.discriminator("invitation", ...)` → `category: "invitation"`인 문서에 적용).
- 하위 타입 전용 필드가 아직 없는 카테고리는 discriminator를 미리 만들지 않는다 — base 모델로 그대로 두다가 그 카테고리에 전용 필드가 실제로 생기는 시점에 같은 패턴으로 추가한다(과설계 방지).

## Gotchas

- `product.model.ts`의 `subCategory` 커스텀 validator가 `this.category`를 참조했다 — document validation(`this`가 Document)에선 동작하지만 update validator(`this`가 Query, `runValidators: true` 켰을 때)에선 `this.category`가 `undefined`라 항상 검증 실패했다(mongoose 공식문서: "this is the Query, not the document being updated"). **`this.get('category')`로는 안 고쳐진다** — Query의 `.get()`은 이번 update payload에 있는 값만 리턴하고, payload에 `category`가 없으면 기존 문서 값을 안 가져온다(공식문서가 이 동작을 명시하지 않아 DB로 직접 검증). 실제 고친 방식: payload에 `category`가 없으면 `this.model.findOne(this.getQuery())`로 기존 문서를 비동기 조회해 폴백한다(mongoose 공식문서의 `pre('findOneAndUpdate')` 예제가 보여주는 패턴을 validator에 적용).
- discriminator 전용 필드(`product.model.ts`의 `previewUrl`)는 **읽기는 base 모델로 해도 되지만 쓰기(생성/`findOneAndUpdate`)는 반드시 그 discriminator 모델을 골라야 한다** — mongoose가 `find()`/`findOne()` 결과는 discriminatorKey 값을 보고 알아서 올바른 서브타입으로 hydrate해주지만(읽기는 base로 충분), 쓰기 경로는 그 자동 판별이 없다. base 모델로 `findOneAndUpdate`하면 discriminator 전용 필드는 그 모델 스키마에 없는 path라 strict 모드(mongoose 기본값)에 의해 조용히 버려진다 — 에러 없이 그냥 저장이 안 된다(`services/product.service.ts`의 `getWritableProductModel`이 이 분기를 담당).

## 관련 문서

- API/도메인 계약 타입과의 경계: `src/shared/types/CLAUDE.md`
- 이 모델을 조회/조작하는 비즈니스 로직: `src/server/services/CLAUDE.md`
