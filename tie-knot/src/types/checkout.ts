import { SelectFeatureDto } from "@/schemas/order.schema";

export interface CheckoutItem {
  productId: string;
  coupleInfoId?: string; // 재결제 시 IOrder에서 주입, 정상 흐름은 URL query 사용

  title: string;
  thumbnail: string;

  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  optionsTotalPrice: number;
  finalPrice: number;

  quantity: number;
  selectedFeatures: SelectFeatureDto[];
}
