import { PAY_METHOD } from "@/constants/payment";
import z from "zod";

export const BuyerInfoSchema = z.object({
  buyerName: z.string().min(2, { message: "이름은 2자 이상 입력해주세요." }),
  buyerEmail: z.string().email({ message: "유효한 이메일을 입력해주세요." }),
  buyerPhone: z.string().regex(/^\d{3}-\d{3,4}-\d{4}$/, {
    message: "연락처 형식이 올바르지 않습니다.",
  }),
  payMethod: z.enum(PAY_METHOD, {
    message: "결제 수단을 선택해주세요.",
  }),
});

const SelectedFeatureSchema = z.object({
  featureId: z.string().min(1, "옵션 ID가 필요합니다."),
  label: z.string().min(1, "옵션 이름이 필요합니다."),
  price: z.number().min(0, "가격은 0 이상이어야 합니다."),
  code: z.string().min(1, "옵션 코드가 필요합니다."),
});

const ProductSnapshotSchema = z.object({
  productId: z.string().min(1, "상품 ID가 필요합니다."),
  title: z.string().min(1, "상품명은 필수입니다."),
  thumbnail: z.string().url("유효한 이미지 경로가 필요합니다."),
  pricing: z.object({
    originalPrice: z.number().min(0),
    discountedPrice: z.number().min(0),
  }),
  quantity: z.number().min(1).default(1),
  selectedFeatures: z.array(SelectedFeatureSchema).default([]),
});

export const createOrderSchema = BuyerInfoSchema.extend({
  coupleInfoId: z.string().min(1, "커플 정보 ID가 필요합니다."),
  buyerName: z.string().min(2, "이름은 2자 이상 입력해주세요."),
  buyerEmail: z.email("유효한 이메일을 입력해주세요."),
  buyerPhone: z
    .string()
    .regex(/^\d{3}-\d{3,4}-\d{4}$/, "연락처 형식이 올바르지 않습니다."),

  // 평면적인 필드들을 'product' 객체로 묶음
  product: ProductSnapshotSchema,

  payMethod: z.enum(PAY_METHOD, { message: "결제 수단을 선택해주세요." }),

  // 할인은 옵션일 수 있으므로 0을 기본값으로
  discountRate: z.number().min(0).max(1).default(0),
  discountAmount: z.number().min(0).default(0),
});

export type SelectFeatureDto = z.infer<typeof SelectedFeatureSchema>;
export type BuyerInfo = z.infer<typeof BuyerInfoSchema>;
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
