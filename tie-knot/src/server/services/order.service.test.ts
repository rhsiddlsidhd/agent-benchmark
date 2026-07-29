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
  attachCoupleInfoToOrder,
  findExpiredAwaitingCoupleInfoOrders,
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

    it("coupleInfoId 없이도(결제 이후 my-orders에서 채우는 흐름) 주문이 생성된다", async () => {
      const input = buildOrderInput({ coupleInfoId: undefined });

      const result = await createOrderService(input);

      const saved = await OrderModel.findById(result._id).lean();
      expect(saved?.coupleInfoId).toBeUndefined();
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

  describe("attachCoupleInfoToOrder", () => {
    it("결제완료(CONFIRMED)된 본인 주문에 커플 정보를 연결한다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInput({ userId, coupleInfoId: undefined }),
      );
      await OrderModel.updateOne({ _id: created._id }, { orderStatus: "CONFIRMED" });
      const coupleInfoId = new mongoose.Types.ObjectId().toString();

      const result = await attachCoupleInfoToOrder(created._id.toString(), coupleInfoId, userId);

      expect(result.coupleInfoId?.toString()).toBe(coupleInfoId);
    });

    it("존재하지 않는 주문이면 NOT_FOUND를 던진다", async () => {
      const missingOrderId = new mongoose.Types.ObjectId().toString();

      await expect(
        attachCoupleInfoToOrder(
          missingOrderId,
          new mongoose.Types.ObjectId().toString(),
          new mongoose.Types.ObjectId().toString(),
        ),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
    });

    it("본인 주문이 아니면 FORBIDDEN을 던진다", async () => {
      const ownerId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInput({ userId: ownerId, coupleInfoId: undefined }),
      );
      await OrderModel.updateOne({ _id: created._id }, { orderStatus: "CONFIRMED" });
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        attachCoupleInfoToOrder(
          created._id.toString(),
          new mongoose.Types.ObjectId().toString(),
          otherUserId,
        ),
      ).rejects.toMatchObject({ category: "FORBIDDEN" });
    });

    it("결제 완료(CONFIRMED) 상태가 아니면 VALIDATION을 던진다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInput({ userId, coupleInfoId: undefined }),
      );

      await expect(
        attachCoupleInfoToOrder(
          created._id.toString(),
          new mongoose.Types.ObjectId().toString(),
          userId,
        ),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });
  });

  describe("findExpiredAwaitingCoupleInfoOrders", () => {
    it("CONFIRMED + coupleInfoId 없음 + 7일 초과면 조회된다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInput({ userId, coupleInfoId: undefined }),
      );
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne(
        { _id: created._id },
        { orderStatus: "CONFIRMED", confirmedAt: eightDaysAgo },
      );

      const result = await findExpiredAwaitingCoupleInfoOrders(userId);

      expect(result.map((o) => o._id.toString())).toEqual([created._id.toString()]);
    });

    it("7일이 안 지났으면 조회되지 않는다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInput({ userId, coupleInfoId: undefined }),
      );
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      await OrderModel.updateOne(
        { _id: created._id },
        { orderStatus: "CONFIRMED", confirmedAt: oneDayAgo },
      );

      const result = await findExpiredAwaitingCoupleInfoOrders(userId);

      expect(result).toEqual([]);
    });

    it("coupleInfoId가 이미 있으면 조회되지 않는다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(buildOrderInput({ userId }));
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne(
        { _id: created._id },
        { orderStatus: "CONFIRMED", confirmedAt: eightDaysAgo },
      );

      const result = await findExpiredAwaitingCoupleInfoOrders(userId);

      expect(result).toEqual([]);
    });

    it("CONFIRMED가 아니면(PENDING/CANCELLED 등) 조회되지 않는다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInput({ userId, coupleInfoId: undefined }),
      );
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne({ _id: created._id }, { confirmedAt: eightDaysAgo });

      const result = await findExpiredAwaitingCoupleInfoOrders(userId);

      expect(result).toEqual([]);
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
