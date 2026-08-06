import { describe, it, expect } from "vitest";
import { productSchema } from "./product.schema";

const buildValidThumbnail = () => new File(["x"], "thumb.png", { type: "image/png" });

const buildValidInput = (overrides?: Record<string, unknown>) => ({
  title: "봄맞이 청첩장",
  description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
  category: "invitation",
  subCategory: "wedding",
  price: 9900,
  isPremium: false,
  isFeatured: false,
  priority: 0,
  thumbnail: buildValidThumbnail(),
  ...overrides,
});

describe("productSchema", () => {
  it("정상 입력은 통과한다", () => {
    const result = productSchema.safeParse(buildValidInput());

    expect(result.success).toBe(true);
  });

  it("category가 invitation이 아니면 실패한다 (business-card는 더 이상 허용되지 않음)", () => {
    const result = productSchema.safeParse(buildValidInput({ category: "business-card" }));

    expect(result.success).toBe(false);
  });

  it("theme을 생략하면 통과한다 (optional)", () => {
    const result = productSchema.safeParse(buildValidInput());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBeUndefined();
    }
  });

  it("theme이 blossom/default가 아니면 실패한다", () => {
    const result = productSchema.safeParse(buildValidInput({ theme: "sunset" }));

    expect(result.success).toBe(false);
  });

  it("카테고리에 허용되지 않는 subCategory면 실패한다", () => {
    const result = productSchema.safeParse(buildValidInput({ subCategory: "store" }));

    expect(result.success).toBe(false);
  });

  it("isPremium인데 featureIds가 비어있으면 실패한다", () => {
    const result = productSchema.safeParse(
      buildValidInput({ isPremium: true, featureIds: [] }),
    );

    expect(result.success).toBe(false);
  });

  it("isPremium이고 featureIds가 채워져 있으면 통과한다", () => {
    const result = productSchema.safeParse(
      buildValidInput({ isPremium: true, featureIds: ["feature-1"] }),
    );

    expect(result.success).toBe(true);
  });

  it("title이 비어있으면 안내 메시지와 함께 실패한다", () => {
    const result = productSchema.safeParse(buildValidInput({ title: "" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("상품명을 입력해주세요.");
    }
  });

  it("description이 10자 미만이면 안내 메시지와 함께 실패한다", () => {
    const result = productSchema.safeParse(buildValidInput({ description: "짧음" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "상품 설명은 최소 10자 이상이어야 합니다.",
      );
    }
  });

  it("subCategory가 비어있으면 안내 메시지와 함께 실패한다", () => {
    const result = productSchema.safeParse(buildValidInput({ subCategory: "" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("서브 카테고리를 선택해주세요.");
    }
  });

  it("허용되지 않는 subCategory면 전용 안내 메시지를 반환한다", () => {
    const result = productSchema.safeParse(buildValidInput({ subCategory: "store" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "해당 카테고리에서 허용되지 않는 서브 카테고리입니다.",
      );
      expect(result.error.issues[0].path).toEqual(["subCategory"]);
    }
  });

  it("price가 음수면 안내 메시지와 함께 실패한다", () => {
    const result = productSchema.safeParse(buildValidInput({ price: -1 }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("가격은 0 이상이어야 합니다.");
    }
  });

  it("price가 0이면 통과한다 (경계값)", () => {
    const result = productSchema.safeParse(buildValidInput({ price: 0 }));

    expect(result.success).toBe(true);
  });

  it("discount.value가 음수면 실패한다", () => {
    const result = productSchema.safeParse(
      buildValidInput({ discount: { discountType: "rate", value: -1 } }),
    );

    expect(result.success).toBe(false);
  });

  it("discount.discountType이 rate/amount가 아니면 실패한다", () => {
    const result = productSchema.safeParse(
      buildValidInput({ discount: { discountType: "percent", value: 0 } }),
    );

    expect(result.success).toBe(false);
  });

  it("discount를 생략하면 통과한다 (optional)", () => {
    const result = productSchema.safeParse(buildValidInput());

    expect(result.success).toBe(true);
  });

  it("status가 허용된 값이 아니면 실패한다", () => {
    const result = productSchema.safeParse(buildValidInput({ status: "unknown" }));

    expect(result.success).toBe(false);
  });

  it("status를 생략하면 통과한다 (optional)", () => {
    const result = productSchema.safeParse(buildValidInput());

    expect(result.success).toBe(true);
  });

  it("thumbnail이 File이 아니면 안내 메시지와 함께 실패한다", () => {
    const result = productSchema.safeParse(buildValidInput({ thumbnail: "not-a-file" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("썸네일 이미지를 등록해주세요.");
    }
  });

  it("thumbnail 파일 크기가 0이면 안내 메시지와 함께 실패한다", () => {
    const emptyFile = new File([], "empty.png", { type: "image/png" });
    const result = productSchema.safeParse(buildValidInput({ thumbnail: emptyFile }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("썸네일 이미지를 등록해주세요.");
    }
  });

  it("isPremium이고 featureIds를 아예 생략하면 실패한다 (옵션을 선택해주세요)", () => {
    const result = productSchema.safeParse(
      buildValidInput({ isPremium: true }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("옵션을 선택해주세요.");
      expect(result.error.issues[0].path).toEqual(["featureIds"]);
    }
  });

  // ── REQ-2/REQ-3: images/minQuantity/maxQuantity ──────────────────────
  describe("images/minQuantity/maxQuantity", () => {
    it("images/minQuantity/maxQuantity를 생략해도 통과한다 (default: {existing:[],newFiles:[]}/1/0, invitation)", () => {
      const result = productSchema.safeParse(buildValidInput());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.images).toEqual({ existing: [], newFiles: [] });
        expect(result.data.minQuantity).toBe(1);
        expect(result.data.maxQuantity).toBe(0);
      }
    });

    it("invitation은 images 없이 통과한다 (previewUrl이 대신함)", () => {
      const result = productSchema.safeParse(
        buildValidInput({ category: "invitation", subCategory: "wedding" }),
      );

      expect(result.success).toBe(true);
    });

    it("물리 상품(favor 등)은 images가 비어있으면 실패한다", () => {
      const result = productSchema.safeParse(
        buildValidInput({ category: "favor", subCategory: "candle" }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("상세 이미지를 1장 이상 등록해주세요.");
        expect(result.error.issues[0].path).toEqual(["images"]);
      }
    });

    it("물리 상품은 existing URL만 있어도(수정 흐름, 신규 파일 없음) 통과한다", () => {
      const result = productSchema.safeParse(
        buildValidInput({
          category: "favor",
          subCategory: "candle",
          images: { existing: ["https://example.com/a.jpg"], newFiles: [] },
        }),
      );

      expect(result.success).toBe(true);
    });

    it("물리 상품은 newFiles만 있어도(신규 등록) 통과한다", () => {
      const result = productSchema.safeParse(
        buildValidInput({
          category: "accessory",
          subCategory: "ring-pillow",
          images: {
            existing: [],
            newFiles: [new File(["x"], "a.jpg", { type: "image/jpeg" })],
          },
        }),
      );

      expect(result.success).toBe(true);
    });

    it("maxQuantity가 minQuantity보다 작으면 실패한다", () => {
      const result = productSchema.safeParse(
        buildValidInput({ minQuantity: 5, maxQuantity: 3 }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "최대 구매 수량은 최소 구매 수량보다 크거나 같아야 합니다.",
        );
        expect(result.error.issues[0].path).toEqual(["maxQuantity"]);
      }
    });

    it("maxQuantity가 minQuantity 이상이면 통과한다", () => {
      const result = productSchema.safeParse(
        buildValidInput({ minQuantity: 3, maxQuantity: 5 }),
      );

      expect(result.success).toBe(true);
    });

    it("maxQuantity가 0(무제한)이면 minQuantity와 무관하게 통과한다", () => {
      const result = productSchema.safeParse(
        buildValidInput({ minQuantity: 5, maxQuantity: 0 }),
      );

      expect(result.success).toBe(true);
    });

    it("minQuantity가 0이면 실패한다 (1 이상)", () => {
      const result = productSchema.safeParse(buildValidInput({ minQuantity: 0 }));

      expect(result.success).toBe(false);
    });

    it("minQuantity가 정수가 아니면 실패한다", () => {
      const result = productSchema.safeParse(buildValidInput({ minQuantity: 1.5 }));

      expect(result.success).toBe(false);
    });

    it("maxQuantity가 음수면 실패한다", () => {
      const result = productSchema.safeParse(buildValidInput({ maxQuantity: -1 }));

      expect(result.success).toBe(false);
    });
  });
});
