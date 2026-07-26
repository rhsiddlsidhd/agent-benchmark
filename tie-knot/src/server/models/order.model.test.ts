import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { OrderModel } from "./order.model";

const buildOrder = (overrides?: Record<string, unknown>) => ({
  merchantUid: "ORDER-1",
  coupleInfoId: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
  buyerName: "김철수",
  buyerEmail: "buyer@example.com",
  buyerPhone: "010-1234-5678",
  product: {
    productId: new mongoose.Types.ObjectId(),
    title: "봄맞이 청첩장",
    thumbnail: "https://example.com/thumbnail.jpg",
    pricing: { originalPrice: 9900, discountedPrice: 9900 },
    quantity: 1,
    selectedFeatures: [] as unknown[],
  },
  finalPrice: 9900,
  payMethod: "CARD",
  ...overrides,
});

describe("OrderModel", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("coupleInfoId 없이 생성하면 검증 에러를 던진다", async () => {
    await expect(
      OrderModel.create(buildOrder({ coupleInfoId: undefined })),
    ).rejects.toThrow(/coupleInfoId/);
  });

  it("finalPrice 없이 생성하면 검증 에러를 던진다 (모델은 계산 안 함, services가 필수로 채워야 함)", async () => {
    await expect(
      OrderModel.create(buildOrder({ finalPrice: undefined })),
    ).rejects.toThrow(/finalPrice/);
  });

  it("timestamps로 createdAt/updatedAt을 둘 다 생성한다", async () => {
    const order = await OrderModel.create(buildOrder());

    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.updatedAt).toBeInstanceOf(Date);
  });

  it("toJSON은 __v를 제거한다", async () => {
    const order = await OrderModel.create(buildOrder());

    expect(order.toJSON()).not.toHaveProperty("__v");
  });
});
