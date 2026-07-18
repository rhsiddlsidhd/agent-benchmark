import { APIRouteResponse } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { NextRequest } from "next/server";
import { z } from "zod";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { decrypt } from "@/lib/token";

const createOrderRequestSchema = z.object({
  productId: z.string().min(1, { message: "상품 ID가 필요합니다." }),
  originalPrice: z.number().positive({ message: "가격은 양수여야 합니다." }),
  selectedOptions: z.array(
    z.object({
      _id: z.string(),
      label: z.string(),
      price: z.number(),
    }),
  ),
  totalPrice: z.number().positive({ message: "총 가격은 양수여야 합니다." }),
  buyerName: z.string().min(2, { message: "이름은 2자 이상이어야 합니다." }),
  buyerEmail: z.string().email({ message: "유효한 이메일이어야 합니다." }),
  buyerTel: z.string().regex(/^\d{3}-\d{3,4}-\d{4}$/, {
    message: "연락처 형식이 올바르지 않습니다.",
  }),
});

type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export const POST = async (
  req: NextRequest,
): Promise<APIRouteResponse<{ merchantUid: string; orderId: string }>> => {
  try {
    // 인증 확인 - Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[Order Create] No auth header");
      throw new HTTPError("로그인이 필요합니다.", 401);
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    let payload;
    try {
      const result = await decrypt({ token, type: "ACCESS" });
      payload = result.payload;

      if (!payload.id) {
        console.error("[Order Create] No payload.id");
        throw new HTTPError("유효하지 않은 토큰입니다.", 401);
      }
    } catch (decryptError) {
      console.error("[Order Create] Decrypt failed:", decryptError);
      throw new HTTPError("유효하지 않은 토큰입니다.", 401);
    }

    const body = await req.json();

    // 유효성 검사
    const parsed = validateAndFlatten<CreateOrderRequest>(
      createOrderRequestSchema,
      body,
    );

    if (!parsed.success) {
      throw new HTTPError("입력값을 확인해주세요", 400, parsed.error);
    }

    // TODO: 이 API는 아직 완전히 구현되지 않았습니다.
    // createOrderService를 사용하여 주문을 생성하고,
    // payment는 결제 완료 후 syncPayment로 생성됩니다.
    throw new HTTPError("이 API는 현재 사용할 수 없습니다.", 501);
  } catch (error) {
    return handleRouteError(error);
  }
};
