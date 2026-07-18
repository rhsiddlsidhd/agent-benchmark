import z from "zod";
import { SUB_CATEGORY_MAP, SubCategory } from "@/utils/category";

export const productSchema = z
  .object({
    title: z.string().min(1, "상품명을 입력해주세요."),
    description: z.string().min(10, "상품 설명은 최소 10자 이상이어야 합니다."),
    category: z.enum(["invitation", "business-card"]),
    subCategory: z.string().min(1, "서브 카테고리를 선택해주세요."),
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
      const allowed = SUB_CATEGORY_MAP[data.category as keyof typeof SUB_CATEGORY_MAP];
      return allowed?.includes(data.subCategory as SubCategory) ?? false;
    },
    {
      message: "해당 카테고리에서 허용되지 않는 서브 카테고리입니다.",
      path: ["subCategory"],
    },
  );

export type ProductDto = z.infer<typeof productSchema>;
