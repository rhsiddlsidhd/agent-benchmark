import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildOrderInput } from "@/test/factories/order.factory";
import { OrderModel } from "@/server/models";
import { createOrderService } from "./order.service";

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
  });
});
