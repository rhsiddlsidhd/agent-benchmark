import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildProductInput } from "@/test/factories/product.factory";
import { AppError } from "@/shared/types";
import { ProductModel, InvitationProductModel } from "@/server/models";
import {
  createProductService,
  getProductService,
  incrementProductViewsService,
  getAllProductsService,
  getFeaturedTemplatesService,
  getPopularProductsService,
  updateProductService,
  deleteProductService,
  updateProductLikeService,
  searchProductsService,
  getProductQuantityBoundsService,
} from "./product.service";

// images/minQuantity/maxQuantity 필드 자체가 없는 레거시 문서 — mongoose 경로를
// 우회해 직접 삽입한다(§8 #12 test-suite 요청사항: 정상 케이스만으론 .lean() +
// mongoose default 미적용 함정이 절대 드러나지 않는다).
const insertLegacyProductWithoutQuantityFields = async (title: string) => {
  const result = await ProductModel.collection.insertOne({
    authorId: "legacy",
    title,
    description: "레거시 문서(필드 없음)",
    thumbnail: "https://example.com/legacy.jpg",
    price: 1000,
    category: "invitation",
    subCategory: "wedding",
    isPremium: false,
    isFeatured: false,
    priority: 0,
    likes: [],
    views: 0,
    salesCount: 0,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    featureIds: [],
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // images/minQuantity/maxQuantity 의도적으로 생략
  } as never);
  return result.insertedId.toString();
};

describe("product.service", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("createProductService", () => {
    it("정상 데이터로 상품을 생성한다", async () => {
      const input = buildProductInput();

      const result = await createProductService(input);

      expect(result).toBe(true);

      const saved = await ProductModel.findOne({ title: input.title }).lean();
      expect(saved).not.toBeNull();
    });

    it("필수 필드 누락으로 mongoose 검증 실패 시 AppError(INTERNAL)를 던진다", async () => {
      const input = buildProductInput({ title: undefined as unknown as string });

      await expect(createProductService(input)).rejects.toBeInstanceOf(
        AppError,
      );
      await expect(createProductService(input)).rejects.toMatchObject({
        category: "INTERNAL",
      });
    });

    it("invitation 카테고리는 previewUrl이 discriminator 스키마에 실제로 저장된다", async () => {
      const input = buildProductInput({ previewUrl: "https://example.com/preview.jpg" });

      await createProductService(input);

      const saved = await InvitationProductModel.findOne({ title: input.title }).lean();
      expect(saved?.previewUrl).toBe("https://example.com/preview.jpg");
    });

    it("theme을 지정하지 않으면 기본값 default가 저장된다", async () => {
      const input = buildProductInput();

      await createProductService(input);

      const saved = await InvitationProductModel.findOne({ title: input.title }).lean();
      expect(saved?.theme).toBe("default");
    });

    it("theme을 지정하면 그 값으로 저장된다", async () => {
      const input = buildProductInput({ theme: "blossom" });

      await createProductService(input);

      const saved = await InvitationProductModel.findOne({ title: input.title }).lean();
      expect(saved?.theme).toBe("blossom");
    });
  });

  describe("getProductService", () => {
    it("존재하는 id면 상품을 리턴한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await getProductService(saved!._id.toString());

      expect(result?.title).toBe(input.title);
    });

    it("존재하지 않는 id면 null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await getProductService(missingId);

      expect(result).toBeNull();
    });

    it("id 형식이 잘못되면 null을 리턴한다", async () => {
      const result = await getProductService("not-a-valid-id");

      expect(result).toBeNull();
    });

    it("userId가 좋아요 목록에 있으면 isLiked를 true로 리턴한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();
      const userId = new mongoose.Types.ObjectId().toString();
      await updateProductLikeService(saved!._id.toString(), userId);

      const result = await getProductService(saved!._id.toString(), userId);

      expect(result?.isLiked).toBe(true);
      expect(result?.likes).toContain(userId);
    });

    it("삭제되지 않은 상품은 deletedAt을 null로 리턴한다 (optional이 아닌 nullable)", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await getProductService(saved!._id.toString());

      expect(result?.deletedAt).toBeNull();
    });

    // ── REQ-2 §7 핵심 리스크: .lean() + mongoose default 미적용 → transformProduct 정규화 ──
    it("images/minQuantity/maxQuantity 필드가 없는 레거시 문서는 [] / 1 / 1로 정규화된다 (maxQuantity는 0이 아니라 1 — REQ-4 회귀 방지)", async () => {
      const legacyId = await insertLegacyProductWithoutQuantityFields("레거시 상품");

      const result = await getProductService(legacyId);

      expect(result?.images).toEqual([]);
      expect(result?.minQuantity).toBe(1);
      expect(result?.maxQuantity).toBe(1);
    });

    it("신규 생성 상품은 images/minQuantity/maxQuantity를 지정한 값 그대로 리턴한다", async () => {
      const input = buildProductInput({
        images: ["https://example.com/a.jpg"],
        minQuantity: 3,
        maxQuantity: 10,
      });
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await getProductService(saved!._id.toString());

      expect(result?.images).toEqual(["https://example.com/a.jpg"]);
      expect(result?.minQuantity).toBe(3);
      expect(result?.maxQuantity).toBe(10);
    });

    it("minQuantity/maxQuantity를 생략하고 생성하면 mongoose default(1/0)가 저장된다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await getProductService(saved!._id.toString());

      expect(result?.minQuantity).toBe(1);
      expect(result?.maxQuantity).toBe(0);
    });
  });

  describe("getProductQuantityBoundsService", () => {
    it("정상 문서는 저장된 minQuantity/maxQuantity를 그대로 리턴한다", async () => {
      const input = buildProductInput({ minQuantity: 2, maxQuantity: 5 });
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await getProductQuantityBoundsService(saved!._id.toString());

      expect(result).toEqual({ minQuantity: 2, maxQuantity: 5 });
    });

    it("필드가 없는 레거시 문서는 {minQuantity:1, maxQuantity:1}로 폴백한다 (REQ-5 핵심 — 안 하면 검증 무증상 통과)", async () => {
      const legacyId = await insertLegacyProductWithoutQuantityFields("레거시 주문 대상");

      const result = await getProductQuantityBoundsService(legacyId);

      expect(result).toEqual({ minQuantity: 1, maxQuantity: 1 });
    });

    it("존재하지 않는 id면 null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await getProductQuantityBoundsService(missingId);

      expect(result).toBeNull();
    });

    it("id 형식이 잘못되면 null을 리턴한다", async () => {
      const result = await getProductQuantityBoundsService("not-a-valid-id");

      expect(result).toBeNull();
    });

    it("삭제된(deletedAt 존재) 상품이면 null을 리턴한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();
      await deleteProductService(saved!._id.toString());

      const result = await getProductQuantityBoundsService(saved!._id.toString());

      expect(result).toBeNull();
    });
  });

  describe("incrementProductViewsService", () => {
    it("views를 1 증가시키고 true를 리턴한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await incrementProductViewsService(saved!._id.toString());

      expect(result).toBe(true);
      const updated = await ProductModel.findById(saved!._id).lean();
      expect(updated?.views).toBe(1);
    });

    it("여러 번 호출하면 그만큼 누적 증가한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      await incrementProductViewsService(saved!._id.toString());
      await incrementProductViewsService(saved!._id.toString());
      await incrementProductViewsService(saved!._id.toString());

      const updated = await ProductModel.findById(saved!._id).lean();
      expect(updated?.views).toBe(3);
    });

    it("존재하지 않는 id면 false를 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await incrementProductViewsService(missingId);

      expect(result).toBe(false);
    });

    it("id 형식이 잘못되면 false를 리턴한다", async () => {
      const result = await incrementProductViewsService("not-a-valid-id");

      expect(result).toBe(false);
    });
  });

  describe("getAllProductsService", () => {
    it("카테고리 없이 호출하면 전체 상품을 리턴한다", async () => {
      await createProductService(buildProductInput({ title: "상품1" }));
      await createProductService(buildProductInput({ title: "상품2" }));

      const result = await getAllProductsService();

      expect(result).toHaveLength(2);
    });

    it("카테고리를 지정하면 해당 카테고리에 속하는 상품만 리턴한다", async () => {
      await createProductService(buildProductInput({ title: "상품1" }));
      await createProductService(buildProductInput({ title: "상품2" }));

      const result = await getAllProductsService("invitation");
      const noMatch = await getAllProductsService("nonexistent");

      expect(result).toHaveLength(2);
      expect(noMatch).toHaveLength(0);
    });
  });

  describe("getFeaturedTemplatesService", () => {
    it("priority가 1 이상인 active 상품만 리턴한다", async () => {
      await createProductService(
        buildProductInput({ title: "추천상품", priority: 1 }),
      );
      await createProductService(
        buildProductInput({ title: "일반상품", priority: 0 }),
      );

      const result = await getFeaturedTemplatesService("invitation");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("추천상품");
    });
  });

  describe("getPopularProductsService", () => {
    // 좋아요 N개를 만들기 위해 서로 다른 userId N명으로 각각 1회씩 toggle한다
    // (updateProductLikeService는 유저 1명당 1회 토글이라 이렇게 해야 정확한 개수가 만들어진다).
    const likeNTimes = async (productId: string, n: number) => {
      for (let i = 0; i < n; i++) {
        await updateProductLikeService(
          productId,
          new mongoose.Types.ObjectId().toString(),
        );
      }
    };

    it("좋아요 수 내림차순으로 정렬하고, 동점은 isFeatured가 앞선다 (0개/soft-deleted/likes필드없음 제외)", async () => {
      await createProductService(buildProductInput({ title: "A-3좋아요" }));
      await createProductService(
        buildProductInput({ title: "B-2좋아요-일반", isFeatured: false }),
      );
      await createProductService(
        buildProductInput({ title: "C-2좋아요-featured", isFeatured: true }),
      );
      await createProductService(buildProductInput({ title: "D-1좋아요" }));
      await createProductService(buildProductInput({ title: "E-0좋아요" }));

      const a = await ProductModel.findOne({ title: "A-3좋아요" }).lean();
      const b = await ProductModel.findOne({ title: "B-2좋아요-일반" }).lean();
      const c = await ProductModel.findOne({ title: "C-2좋아요-featured" }).lean();
      const d = await ProductModel.findOne({ title: "D-1좋아요" }).lean();
      await likeNTimes(a!._id.toString(), 3);
      await likeNTimes(b!._id.toString(), 2);
      await likeNTimes(c!._id.toString(), 2);
      await likeNTimes(d!._id.toString(), 1);
      // E는 좋아요 0개(제외 대상) — 아무것도 하지 않는다.

      // soft-deleted: 좋아요가 많아도(5개) 제외돼야 한다.
      await createProductService(buildProductInput({ title: "F-삭제됨" }));
      const f = await ProductModel.findOne({ title: "F-삭제됨" }).lean();
      await likeNTimes(f!._id.toString(), 5);
      await deleteProductService(f!._id.toString());

      // likes 필드 자체가 없는 레거시 문서 — mongoose 경로를 우회해 직접 삽입한다.
      await ProductModel.collection.insertOne({
        authorId: "legacy",
        title: "G-likes필드없음",
        description: "레거시 문서",
        thumbnail: "https://example.com/legacy.jpg",
        price: 1000,
        category: "invitation",
        subCategory: "wedding",
        isPremium: false,
        isFeatured: false,
        priority: 0,
        views: 0,
        salesCount: 0,
        discount: { discountType: "rate", value: 0 },
        status: "active",
        featureIds: [],
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const result = await getPopularProductsService();

      expect(result.map((p) => p.title)).toEqual([
        "A-3좋아요",
        "C-2좋아요-featured",
        "B-2좋아요-일반",
        "D-1좋아요",
      ]);
    });

    it("limit을 넘겨주면 그 개수만큼만 리턴한다", async () => {
      await createProductService(buildProductInput({ title: "1" }));
      await createProductService(buildProductInput({ title: "2" }));
      await createProductService(buildProductInput({ title: "3" }));
      const p1 = await ProductModel.findOne({ title: "1" }).lean();
      const p2 = await ProductModel.findOne({ title: "2" }).lean();
      const p3 = await ProductModel.findOne({ title: "3" }).lean();
      await likeNTimes(p1!._id.toString(), 3);
      await likeNTimes(p2!._id.toString(), 2);
      await likeNTimes(p3!._id.toString(), 1);

      const result = await getPopularProductsService(2);

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.title)).toEqual(["1", "2"]);
    });

    it("좋아요 1개 이상인 상품이 없으면 빈 배열을 리턴한다 (throw 아님)", async () => {
      await createProductService(buildProductInput({ title: "좋아요없음" }));

      const result = await getPopularProductsService();

      expect(result).toEqual([]);
    });

    it("limit이 0 이하여도 에러 없이 클램프되어 최소 1개는 조회를 시도한다", async () => {
      await createProductService(buildProductInput({ title: "클램프테스트" }));
      const p = await ProductModel.findOne({ title: "클램프테스트" }).lean();
      await likeNTimes(p!._id.toString(), 1);

      await expect(getPopularProductsService(0)).resolves.toHaveLength(1);
      await expect(getPopularProductsService(-5)).resolves.toHaveLength(1);
    });

    it("userId를 넘기면 isLiked를 반영하고, 넘기지 않으면 항상 false다", async () => {
      await createProductService(buildProductInput({ title: "좋아요반영" }));
      const p = await ProductModel.findOne({ title: "좋아요반영" }).lean();
      const userId = new mongoose.Types.ObjectId().toString();
      await updateProductLikeService(p!._id.toString(), userId);

      const withUser = await getPopularProductsService(8, userId);
      const withoutUser = await getPopularProductsService(8);

      expect(withUser[0].isLiked).toBe(true);
      expect(withoutUser[0].isLiked).toBe(false);
    });

    it("응답 객체에 likesCount 내부 계산 필드가 섞여 나가지 않는다 ($unset 확인)", async () => {
      await createProductService(buildProductInput({ title: "unset확인" }));
      const p = await ProductModel.findOne({ title: "unset확인" }).lean();
      await likeNTimes(p!._id.toString(), 1);

      const result = await getPopularProductsService();

      expect(result[0]).not.toHaveProperty("likesCount");
    });
  });

  describe("updateProductService", () => {
    it("정상 업데이트하면 갱신된 상품을 리턴한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await updateProductService(saved!._id.toString(), {
        title: "수정된 제목",
      });

      expect(result?.title).toBe("수정된 제목");
    });

    it("존재하지 않는 id면 null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await updateProductService(missingId, { title: "x" });

      expect(result).toBeNull();
    });

    it("id 형식이 잘못되면 null을 리턴한다", async () => {
      const result = await updateProductService("not-a-valid-id", {
        title: "x",
      });

      expect(result).toBeNull();
    });

    it("isPremium과 featureIds를 같이 보내면 featureIds를 ObjectId로 변환해 저장한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();
      const featureId = new mongoose.Types.ObjectId().toString();

      const result = await updateProductService(saved!._id.toString(), {
        isPremium: true,
        featureIds: [featureId],
      });

      expect(result?.featureIds).toEqual([featureId]);
    });

    it("category 없이 맞는 subCategory로 바꾸면 통과한다 (runValidators)", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await updateProductService(saved!._id.toString(), {
        subCategory: "first-birthday",
      });

      expect(result?.subCategory).toBe("first-birthday");
    });

    it("category 없이 맞지 않는 subCategory로 바꾸면 AppError(INTERNAL)를 던진다 (runValidators)", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      await expect(
        updateProductService(saved!._id.toString(), {
          subCategory: "store",
        }),
      ).rejects.toMatchObject({ category: "INTERNAL" });
    });

    it("invitation 상품의 previewUrl을 category와 함께 보내면 갱신된다 (discriminator 모델 경유)", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await updateProductService(saved!._id.toString(), {
        category: "invitation",
        previewUrl: "https://example.com/updated-preview.jpg",
      });

      expect(result?.previewUrl).toBe("https://example.com/updated-preview.jpg");
    });
  });

  describe("deleteProductService", () => {
    it("정상 삭제하면 true를 리턴한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();

      const result = await deleteProductService(saved!._id.toString());

      expect(result).toBe(true);

      const deleted = await ProductModel.findById(saved!._id).lean();
      expect(deleted?.status).toBe("deleted");
    });

    it("존재하지 않는 id면 false를 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await deleteProductService(missingId);

      expect(result).toBe(false);
    });

    it("id 형식이 잘못되면 false를 리턴한다", async () => {
      const result = await deleteProductService("not-a-valid-id");

      expect(result).toBe(false);
    });
  });

  describe("updateProductLikeService", () => {
    it("좋아요가 없으면 추가하고 true를 리턴한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();
      const userId = new mongoose.Types.ObjectId().toString();

      const result = await updateProductLikeService(
        saved!._id.toString(),
        userId,
      );

      expect(result).toBe(true);
      const updated = await ProductModel.findById(saved!._id).lean();
      expect(updated?.likes.map((id) => id.toString())).toContain(userId);
    });

    it("이미 좋아요면 취소하고 true를 리턴한다", async () => {
      const input = buildProductInput();
      await createProductService(input);
      const saved = await ProductModel.findOne({ title: input.title }).lean();
      const userId = new mongoose.Types.ObjectId().toString();

      await updateProductLikeService(saved!._id.toString(), userId);
      const result = await updateProductLikeService(
        saved!._id.toString(),
        userId,
      );

      expect(result).toBe(true);
      const updated = await ProductModel.findById(saved!._id).lean();
      expect(updated?.likes.map((id) => id.toString())).not.toContain(userId);
    });

    it("존재하지 않는 id면 false를 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await updateProductLikeService(
        missingId,
        new mongoose.Types.ObjectId().toString(),
      );

      expect(result).toBe(false);
    });

    it("id 형식이 잘못되면 false를 리턴한다", async () => {
      const result = await updateProductLikeService(
        "not-a-valid-id",
        new mongoose.Types.ObjectId().toString(),
      );

      expect(result).toBe(false);
    });
  });

  describe("searchProductsService", () => {
    it("q가 undefined면 DB를 치지 않고 빈 배열을 리턴한다", async () => {
      await createProductService(buildProductInput({ title: "봄맞이 청첩장" }));

      const result = await searchProductsService(undefined);

      expect(result).toEqual([]);
    });

    it("q가 공백뿐이면 빈 배열을 리턴한다", async () => {
      await createProductService(buildProductInput({ title: "봄맞이 청첩장" }));

      const result = await searchProductsService("   ");

      expect(result).toEqual([]);
    });

    it("title에 부분일치(대소문자 무시)하는 상품을 리턴한다", async () => {
      await createProductService(
        buildProductInput({ title: "Spring Wedding Card", subCategory: "first-birthday" }),
      );
      await createProductService(
        buildProductInput({ title: "가을 청첩장", subCategory: "first-birthday" }),
      );

      const result = await searchProductsService("wedding");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Spring Wedding Card");
    });

    it("regex 메타문자가 포함된 검색어도 리터럴로 취급해 에러 없이 처리한다", async () => {
      await createProductService(buildProductInput({ title: "a.b(c)" }));
      await createProductService(buildProductInput({ title: "axbc" }));

      const result = await searchProductsService("a.b(c)");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("a.b(c)");
    });

    it("카테고리 라벨 부분일치로 역조회해 매칭한다 ('초대' -> '초대장' -> invitation)", async () => {
      await createProductService(
        buildProductInput({ title: "무관한 제목", category: "invitation" }),
      );

      const result = await searchProductsService("초대");

      expect(result).toHaveLength(1);
    });

    it("서브카테고리 라벨 부분일치로 역조회해 매칭한다 ('돌잔' -> '돌잔치' -> first-birthday)", async () => {
      await createProductService(
        buildProductInput({ title: "무관한 제목1", subCategory: "first-birthday" }),
      );
      await createProductService(
        buildProductInput({ title: "무관한 제목2", subCategory: "wedding" }),
      );

      const result = await searchProductsService("돌잔");

      expect(result).toHaveLength(1);
      expect(result[0].subCategory).toBe("first-birthday");
    });

    it("검색어 1글자는 title regex만 적용하고 라벨 역조회는 건너뛴다", async () => {
      await createProductService(
        // title에 "장"이 없어야 한다 — 기존 "가을맞이 청첩장"은 title에도 "장"이 있어 교체 필수
        buildProductInput({ title: "가을맞이 카드", subCategory: "wedding" }),
      );

      const result = await searchProductsService("장");

      // "장"은 subCategoryLabels.wedding === "청첩장"과 productCategoryLabels.invitation === "초대장"에
      // 모두 포함되지만, 2글자 미만이라 라벨 역조회가 스킵된다.
      // title("가을맞이 카드")에도 "장"이 없으므로 빈 배열이어야 한다.
      expect(result).toEqual([]);
    });

    it("어떤 라벨과도 안 겹치는 검색어는 title 조건만으로 정상 조회된다 (에러 아님)", async () => {
      await createProductService(buildProductInput({ title: "웨딩드레스 특가" }));

      const result = await searchProductsService("웨딩드레스");

      expect(result).toHaveLength(1);
    });

    it("삭제된 상품(deletedAt 존재)은 결과에서 제외한다", async () => {
      await createProductService(buildProductInput({ title: "청첩장 매칭 대상" }));
      const saved = await ProductModel.findOne({ title: "청첩장 매칭 대상" }).lean();
      await deleteProductService(saved!._id.toString());

      const result = await searchProductsService("청첩장");

      expect(result).toEqual([]);
    });

    it("매칭되는 상품이 없으면 빈 배열을 리턴한다 (에러 아님)", async () => {
      await createProductService(buildProductInput({ title: "봄맞이 청첩장" }));

      const result = await searchProductsService("전혀다른검색어XYZ");

      expect(result).toEqual([]);
    });

    it("userId를 넘기면 좋아요 여부(isLiked)를 반영한다", async () => {
      await createProductService(buildProductInput({ title: "좋아요 테스트 청첩장" }));
      const saved = await ProductModel.findOne({ title: "좋아요 테스트 청첩장" }).lean();
      const userId = new mongoose.Types.ObjectId().toString();
      await updateProductLikeService(saved!._id.toString(), userId);

      const result = await searchProductsService("청첩장", userId);

      expect(result).toHaveLength(1);
      expect(result[0].isLiked).toBe(true);
    });
  });
});
