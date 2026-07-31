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
  updateProductService,
  deleteProductService,
  updateProductLikeService,
  searchProductsService,
} from "./product.service";

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
        subCategory: "vip",
      });

      expect(result?.subCategory).toBe("vip");
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
        buildProductInput({ title: "Spring Wedding Card", subCategory: "vip" }),
      );
      await createProductService(
        buildProductInput({ title: "가을 청첩장", subCategory: "vip" }),
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
        buildProductInput({ title: "가을맞이 청첩장", subCategory: "business" }),
      );

      const result = await searchProductsService("비");

      // "비"는 subCategoryLabels.business === "비즈니스"에 포함되지만
      // 2글자 미만이라 라벨 역조회가 스킵된다. title("가을맞이 청첩장")에도 "비"가 없으므로 빈 배열이어야 한다.
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
