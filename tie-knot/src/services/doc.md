# Mongoose 쿼리 결과 처리 가이드: `.lean()` vs `.map(doc => doc.toJSON())`

Mongoose로 데이터를 조회할 때, 반환되는 값은 단순한 JavaScript 객체(POJO)가 아닌 Mongoose의 모든 기능이 포함된 Document 객체입니다. API 응답 등으로 순수한 객체를 반환해야 할 때, 이 Document 객체를 변환하는 두 가지 주요 방법이 있습니다.

## 1. `.lean()` 사용 방식

`.lean()` 메소드를 쿼리 체인에 추가하면, Mongoose는 Document 객체를 생성하는 과정을 건너뛰고 바로 순수한 JavaScript 객체(POJO)를 반환합니다.

### 예시 코드

```typescript
// getPremiumFeatureService.ts

export const getPremiumFeatureServiceWithLean = async (
  ids: string[],
): Promise<any[]> => { // 반환 타입이 단순 객체이므로 any 또는 별도 타입 지정 필요
  if (ids.length === 0) return [];
  await dbConnect();

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  const features = await FeatureModel.find({ _id: { $in: objectIds } }).lean();
  
  // .lean()은 toJSON 변환을 적용하지 않으므로, 수동으로 변환해야 할 수 있다.
  // 예: features.map(f => ({ ...f, _id: f._id.toString() }));

  return features;
};
```

### 장점
- **성능**: Document 객체를 생성하고 초기화하는 오버헤드가 없으므로 매우 빠릅니다. 대량의 데이터를 조회할 때 유리합니다.

### 단점
- **Mongoose 기능 부재**: 반환된 객체는 `save()`, `populate()` 같은 Document 메소드를 사용할 수 없습니다.
- **스키마 변환 미적용**: 스키마에 정의된 `virtuals`나 `toJSON` 변환 로직이 전혀 적용되지 않습니다. `_id`를 `string`으로 변환하거나 `__v`를 제거하는 등의 작업은 모두 수동으로 처리해야 합니다.

---

## 2. `.map(doc => doc.toJSON())` 사용 방식

쿼리로 전체 Mongoose Document 객체를 가져온 후, 배열의 `.map()` 메소드를 사용해 각 Document에 대해 `.toJSON()`을 호출하는 방식입니다.

### 예시 코드

```typescript
// getPremiumFeatureService.ts

export const getPremiumFeatureService = async (
  ids: string[],
): Promise<PremiumFeature[]> => {
  if (ids.length === 0) return [];
  await dbConnect();

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  const features = await FeatureModel.find({ _id: { $in: objectIds } });

  // 각 Document의 .toJSON() 메소드를 호출하여 스키마 변환을 적용
  return features.map((feature) => feature.toJSON() as PremiumFeature);
};
```

### 장점
- **스키마 변환 적용**: 스키마에 정의된 `toJSON` 변환 로직(`virtuals` 포함)이 모두 적용됩니다. 데이터 변환 로직을 모델(스키마)에서 중앙 관리할 수 있어 일관성이 유지됩니다.
- **코드의 명확성**: "데이터를 가져와서 JSON 형태로 변환한다"는 흐름이 코드에 명확하게 드러납니다.

### 단점
- **성능**: 전체 Document 객체를 메모리에 생성했다가 `toJSON`으로 다시 객체를 만들기 때문에 `.lean()` 방식보다는 성능 부하가 약간 더 있습니다.

## 결론 및 권장 사항

| 구분 | `.lean()` | `.map(doc => doc.toJSON())` |
| --- | --- | --- |
| **성능** | 매우 좋음 | 좋음 |
| **스키마 변환** | 미적용 (수동 처리 필요) | **적용 (자동)** |
| **메소드 사용** | 불가능 | 가능 (map 이전) |
| **일관성** | 낮음 (수동 변환) | **높음 (중앙 관리)** |

- **일반적인 경우**: 데이터 변환 로직을 스키마에서 일관되게 관리하고 싶을 때 **`.map(doc => doc.toJSON())`** 방식을 사용하는 것을 권장합니다.
- **성능이 매우 중요한 경우**: 수백, 수천 개의 문서를 읽기 전용으로 빠르게 조회해야 하고, 별도의 스키마 변환이 필요 없을 때 `.lean()` 사용을 고려할 수 있습니다.

---

## 3. TypeScript 타입 불일치 및 해결 방법 (`as Type`)

`toJSON()`을 사용하든 `.lean()`을 사용하든, TypeScript는 Mongoose가 동적으로 반환하는 객체의 타입을 100% 정확하게 추론하지 못할 때가 많습니다. 이것이 "타입 불일치" 에러의 주된 원인입니다.

### 문제 상황

- **서비스 함수의 반환 타입**: `Promise<PremiumFeature[]>` 로 명시되어 있습니다. 이 타입은 `_id`가 `string`이어야 합니다.
- **Mongoose의 반환 타입**: `FeatureModel.find()`는 `FeatureDoc[]`을 반환합니다. 이 타입은 `_id`가 `ObjectId`입니다.
- **TypeScript의 관점**: `feature.toJSON()`이 런타임에 타입을 바꾸는 것을 정적으로 알 수 없으므로, `ObjectId` 타입을 `string` 타입에 할당할 수 없다는 에러를 발생시킵니다.

### 해결 방법: 타입 단언 (Type Assertion)

이 "정적 타입"과 "동적 결과" 사이의 간극을 메우기 위해, 개발자가 TypeScript에게 타입을 명시적으로 알려주는 **타입 단언 (`as`)**을 사용합니다.

```typescript
// getPremiumFeatureService.ts

export const getPremiumFeatureService = async (
  ids: string[],
): Promise<PremiumFeature[]> => {
  // ...
  const features = await FeatureModel.find({ _id: { $in: objectIds } });

  // .toJSON()의 결과가 PremiumFeature 타입임을 TypeScript에게 "보증"한다.
  return features.map((feature) => feature.toJSON() as PremiumFeature);
};
```

`as PremiumFeature`는 TypeScript에게 "이 객체는 이제부터 `PremiumFeature` 타입으로 취급해도 된다"고 알려주는 역할을 합니다. 이것은 런타임 코드를 바꾸지 않으며, 오직 컴파일 시점의 타입 검사를 통과시키기 위한 목적입니다.

이는 버그 수정이 아니라, 동적으로 타입을 변환하는 라이브러리와 정적 타입 언어를 함께 사용하기 위한 필수적인 패턴입니다.
