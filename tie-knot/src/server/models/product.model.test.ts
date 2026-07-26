import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { ProductModel } from "./product.model";

const buildProduct = (overrides?: Record<string, unknown>) => ({
  authorId: "author-1",
  title: "봄맞이 청첩장",
  description: "봄 시즌 한정 템플릿",
  thumbnail: "https://example.com/thumbnail.jpg",
  price: 9900,
  category: "invitation",
  subCategory: "wedding",
  isPremium: false,
  ...overrides,
});

describe("ProductModel", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("subCategory validator", () => {
    it("생성 시 category와 맞지 않는 subCategory는 검증 에러를 던진다", async () => {
      await expect(
        ProductModel.create(buildProduct({ subCategory: "store" })),
      ).rejects.toThrow(/subCategory/);
    });

    it("생성 시 category와 맞는 subCategory는 통과한다", async () => {
      const product = await ProductModel.create(buildProduct());

      expect(product.subCategory).toBe("wedding");
    });

    it("update로 category 없이 subCategory만 바꿔도 같은 문서의 category 기준으로 검증한다", async () => {
      const product = await ProductModel.create(buildProduct());

      const updated = await ProductModel.findOneAndUpdate(
        { _id: product._id },
        { subCategory: "vip" },
        { runValidators: true, new: true },
      );

      expect(updated?.subCategory).toBe("vip");
    });

    it("update로 category 없이 맞지 않는 subCategory로 바꾸면 검증 에러를 던진다", async () => {
      const product = await ProductModel.create(buildProduct());

      await expect(
        ProductModel.findOneAndUpdate(
          { _id: product._id },
          { subCategory: "store" },
          { runValidators: true },
        ),
      ).rejects.toThrow(/subCategory/);
    });
  });
});
