import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { OrderModel } from "./order.model";

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
      OrderModel.create({
        merchantUid: "ORDER-1",
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
          selectedFeatures: [],
        },
        payMethod: "CARD",
      }),
    ).rejects.toThrow(/coupleInfoId/);
  });

  it("timestamps로 createdAt/updatedAt을 둘 다 생성한다", async () => {
    const order = await OrderModel.create({
      merchantUid: "ORDER-2",
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
        selectedFeatures: [],
      },
      payMethod: "CARD",
    });

    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.updatedAt).toBeInstanceOf(Date);
  });

  it("finalPrice를 직접 안 주면 모델이 알아서 계산하지 않는다 (도메인 계산은 services 소관)", async () => {
    const order = await OrderModel.create({
      merchantUid: "ORDER-3",
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
        selectedFeatures: [],
      },
      payMethod: "CARD",
    });

    expect(order.finalPrice).toBeUndefined();
  });

  it("toJSON은 __v를 제거한다", async () => {
    const order = await OrderModel.create({
      merchantUid: "ORDER-4",
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
        selectedFeatures: [],
      },
      payMethod: "CARD",
    });

    expect(order.toJSON()).not.toHaveProperty("__v");
  });
});
