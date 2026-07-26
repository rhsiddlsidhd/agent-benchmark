import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildOrderInput } from "@/test/factories/order.factory";
import { OrderModel } from "@/server/models";
import {
  createOrderService,
  getOrderSeviceByMerchantUid,
  getActiveOrderInfoByCoupleInfoId,
  getOrdersByUserId,
} from "./order.service";

describe("order.service", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("createOrderService", () => {
    it("생성한 주문에 coupleInfoId가 실제로 저장된다", async () => {
      const input = buildOrderInput();

      const result = await createOrderService(input);

      const saved = await OrderModel.findById(result._id).lean();
      expect(saved?.coupleInfoId?.toString()).toBe(input.coupleInfoId);
    });

    describe("finalPrice 계산", () => {
      it("할인 없으면 상품가*수량 + 옵션가 합산이 finalPrice다", async () => {
        const input = buildOrderInput({
          discountRate: 0,
          discountAmount: 0,
          product: {
            productId: new mongoose.Types.ObjectId().toString(),
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 10000, discountedPrice: 10000 },
            quantity: 2,
            selectedFeatures: [
              { featureId: new mongoose.Types.ObjectId().toString(), code: "f1", label: "옵션1", price: 500 },
            ],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(10000 * 2 + 500);
      });

      it("discountRate를 소계에 적용한다", async () => {
        const input = buildOrderInput({
          discountRate: 0.1,
          discountAmount: 0,
          product: {
            productId: new mongoose.Types.ObjectId().toString(),
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 10000, discountedPrice: 10000 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(9000);
      });

      it("discountRate 적용 후 discountAmount를 추가 차감한다", async () => {
        const input = buildOrderInput({
          discountRate: 0.1,
          discountAmount: 500,
          product: {
            productId: new mongoose.Types.ObjectId().toString(),
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 10000, discountedPrice: 10000 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(8500);
      });

      it("계산 결과가 음수면 0으로 방지한다", async () => {
        const input = buildOrderInput({
          discountRate: 0,
          discountAmount: 999999,
          product: {
            productId: new mongoose.Types.ObjectId().toString(),
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 1000, discountedPrice: 1000 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(0);
      });

      it("소수점 결과는 내림한다", async () => {
        const input = buildOrderInput({
          discountRate: 0.15,
          discountAmount: 0,
          product: {
            productId: new mongoose.Types.ObjectId().toString(),
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 999, discountedPrice: 999 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(Math.floor(999 * 0.85));
      });
    });
  });

  describe("getOrderSeviceByMerchantUid", () => {
    it("존재하는 merchantUid면 주문을 리턴한다", async () => {
      const input = buildOrderInput();
      const created = await createOrderService(input);

      const result = await getOrderSeviceByMerchantUid(created.merchantUid);

      expect(result?.merchantUid).toBe(created.merchantUid);
    });

    it("존재하지 않는 merchantUid면 null을 리턴한다", async () => {
      const result = await getOrderSeviceByMerchantUid("NOT-EXIST");

      expect(result).toBeNull();
    });
  });

  describe("getActiveOrderInfoByCoupleInfoId", () => {
    it("CONFIRMED/COMPLETED 상태 주문이 없으면 빈 값을 리턴한다", async () => {
      const input = buildOrderInput();
      await createOrderService(input);

      const result = await getActiveOrderInfoByCoupleInfoId(
        input.coupleInfoId,
      );

      expect(result).toEqual({ features: [], productId: null });
    });

    it("CONFIRMED 상태 주문이 있으면 feature/productId를 리턴한다", async () => {
      const input = buildOrderInput();
      const created = await createOrderService(input);
      await OrderModel.updateOne(
        { _id: created._id },
        { orderStatus: "CONFIRMED" },
      );

      const result = await getActiveOrderInfoByCoupleInfoId(
        input.coupleInfoId,
      );

      expect(result.productId).toBe(input.product.productId);
      expect(result.features).toEqual([]);
    });
  });

  describe("getOrdersByUserId", () => {
    it("해당 유저의 주문 목록을 리턴한다", async () => {
      const input = buildOrderInput();
      await createOrderService(input);

      const result = await getOrdersByUserId(input.userId);

      expect(result).toHaveLength(1);
    });
  });
});
