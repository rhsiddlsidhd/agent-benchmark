import * as z from "zod";
import { SUB_CATEGORY_MAP, PRODUCT_CATEGORIES } from "@/shared/constants";

export const productSchema = z
  .object({
    title: z.string().min(1, "상품명을 입력해주세요."),
    description: z.string().min(10, "상품 설명은 최소 10자 이상이어야 합니다."),
    category: z.enum(PRODUCT_CATEGORIES),
    subCategory: z.string().min(1, "서브 카테고리를 선택해주세요."),
    theme: z.enum(["blossom", "default"]).optional(),
    price: z.number().min(0, "가격은 0 이상이어야 합니다."),
    isPremium: z.boolean(),
    featureIds: z.array(z.string()).optional(),
    isFeatured: z.boolean(),
    priority: z.number(),
    discount: z.object({
      discountType: z.enum(["rate", "amount"]),
      value: z.number().min(0),
    }).optional(),
    status: z.enum(["active", "inactive", "soldOut", "deleted"]).optional(),
    thumbnail: z
      .instanceof(File, { message: "썸네일 이미지를 등록해주세요." })
      .refine((file) => file.size > 0, {
        message: "썸네일 이미지를 등록해주세요.",
      }),

    // ── 신규 (REQ-2 / REQ-3) ─────────────────────────────
    // 업로드 이전에 검증하므로 "유지할 기존 URL"과 "신규 파일"을 같이 받는다.
    // 형태는 request/coupleInfo.schema.ts:53-70 (coupleInfoClientSchema) 선례 그대로.
    images: z
      .object({
        existing: z.array(z.string().url("유효한 URL이어야 합니다.")).default([]),
        newFiles: z.array(z.instanceof(File)).default([]),
      })
      .default({ existing: [], newFiles: [] }),
    minQuantity: z
      .number()
      .int("최소 구매 수량은 정수여야 합니다.")
      .min(1, "최소 구매 수량은 1 이상이어야 합니다.")
      .default(1),
    maxQuantity: z
      .number()
      .int("최대 구매 수량은 정수여야 합니다.")
      .min(0, "최대 구매 수량은 0 이상이어야 합니다.") // 0 = 무제한
      .default(0),
  })
  .refine(
    (data) => {
      if (data.isPremium && (!data.featureIds || data.featureIds.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "옵션을 선택해주세요.",
      path: ["featureIds"],
    },
  )
  .refine(
    (data) => {
      // 카테고리가 5종으로 늘면서 SUB_CATEGORY_MAP 인덱싱 결과가 카테고리별로 다른
      // 리터럴 튜플 타입의 union이 된다 — 명시적으로 readonly string[]로 넓혀야
      // .includes()가 "Argument of type X is not assignable to parameter of type
      // 'never'"로 막히지 않는다(TS가 union 전체에 공통되는 오버로드를 못 찾음).
      const allowed: readonly string[] | undefined =
        SUB_CATEGORY_MAP[data.category as keyof typeof SUB_CATEGORY_MAP];
      return allowed?.includes(data.subCategory) ?? false;
    },
    {
      message: "해당 카테고리에서 허용되지 않는 서브 카테고리입니다.",
      path: ["subCategory"],
    },
  )
  // invitation은 previewUrl이 상세 확인을 대신하므로 images 없이도 판매 성립.
  // 물리 상품 4종(favor/accessory/guestbook/ceremony)은 최소 1장 필요.
  // 수정 흐름(이미지 안 건드림)을 위해 "유지 URL + 신규 파일" 합계로 센다.
  .refine(
    (data) =>
      data.category === "invitation" ||
      data.images.existing.length + data.images.newFiles.length > 0,
    { message: "상세 이미지를 1장 이상 등록해주세요.", path: ["images"] },
  )
  // maxQuantity 0(무제한)은 하한 비교 대상이 아니다.
  .refine(
    (data) => data.maxQuantity === 0 || data.maxQuantity >= data.minQuantity,
    {
      message: "최대 구매 수량은 최소 구매 수량보다 크거나 같아야 합니다.",
      path: ["maxQuantity"],
    },
  );

export type ProductDto = z.infer<typeof productSchema>;
