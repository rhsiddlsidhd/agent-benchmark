import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildProductInput } from "@/test/factories/product.factory";
import { AppError } from "@/shared/types";
import { ProductModel } from "@/server/models";
import {
  createProductService,
  getProductService,
  getAllProductsService,
  getFeaturedTemplatesService,
  updateProductService,
  deleteProductService,
  updateProductLikeService,
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
  });

  describe("getAllProductsService", () => {
    it("카테고리 없이 호출하면 전체 상품을 리턴한다", async () => {
      await createProductService(buildProductInput({ title: "상품1" }));
      await createProductService(
        buildProductInput({
          title: "상품2",
          category: "business-card",
          subCategory: "business",
        }),
      );

      const result = await getAllProductsService();

      expect(result).toHaveLength(2);
    });

    it("카테고리를 지정하면 해당 카테고리만 리턴한다", async () => {
      await createProductService(buildProductInput({ title: "상품1" }));
      await createProductService(
        buildProductInput({
          title: "상품2",
          category: "business-card",
          subCategory: "business",
        }),
      );

      const result = await getAllProductsService("invitation");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("상품1");
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
});
