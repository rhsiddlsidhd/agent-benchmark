import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { buildCoupleInfoInput, clearCollections } from "@/test";
import { AppError } from "@/shared/types";
import { CoupleInfoModel } from "@/server/models";
import {
  createCoupleInfoService,
  getCoupleInfoById,
  updateCoupleInfoService,
} from "./coupleInfo.service";

describe("coupleInfo.service", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("createCoupleInfoService", () => {
    it("정상 데이터로 커플 정보를 생성한다", async () => {
      const input = buildCoupleInfoInput();

      const result = await createCoupleInfoService(input);

      expect(result.venue).toBe(input.venue);
      expect(result.userId.toString()).toBe(input.userId);

      const saved = await CoupleInfoModel.findById(result._id).lean();
      expect(saved).not.toBeNull();
    });

    it("필수 필드 누락으로 mongoose 검증 실패 시 AppError(INTERNAL)를 던진다", async () => {
      const input = buildCoupleInfoInput({ venue: undefined as unknown as string });

      await expect(createCoupleInfoService(input)).rejects.toMatchObject({
        category: "INTERNAL",
      });
      await expect(createCoupleInfoService(input)).rejects.toBeInstanceOf(
        AppError,
      );
    });
  });

  describe("getCoupleInfoById", () => {
    it("존재하는 id면 커플 정보를 리턴한다", async () => {
      const input = buildCoupleInfoInput();
      const created = await createCoupleInfoService(input);

      const result = await getCoupleInfoById(created._id.toString());

      expect(result?.venue).toBe(input.venue);
    });

    it("존재하지 않는 id면 null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await getCoupleInfoById(missingId);

      expect(result).toBeNull();
    });

    it("id 형식이 잘못되면 null을 리턴한다", async () => {
      const result = await getCoupleInfoById("not-a-valid-id");

      expect(result).toBeNull();
    });
  });

  describe("updateCoupleInfoService", () => {
    it("정상 소유자가 업데이트하면 true를 리턴한다", async () => {
      const input = buildCoupleInfoInput();
      const created = await createCoupleInfoService(input);

      const result = await updateCoupleInfoService(
        created._id.toString(),
        input.userId,
        { ...input, venue: "새 예식장" },
      );

      expect(result).toBe(true);

      const updated = await CoupleInfoModel.findById(created._id).lean();
      expect(updated?.venue).toBe("새 예식장");
    });

    it("id 형식이 잘못되면 AppError(NOT_FOUND)를 던진다", async () => {
      const input = buildCoupleInfoInput();

      await expect(
        updateCoupleInfoService("not-a-valid-id", input.userId, input),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
    });

    it("존재하지 않는 id면 AppError(NOT_FOUND)를 던진다", async () => {
      const input = buildCoupleInfoInput();
      const missingId = new mongoose.Types.ObjectId().toString();

      await expect(
        updateCoupleInfoService(missingId, input.userId, input),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
    });

    it("소유자가 아니면 AppError(FORBIDDEN)를 던진다", async () => {
      const input = buildCoupleInfoInput();
      const created = await createCoupleInfoService(input);
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        updateCoupleInfoService(created._id.toString(), otherUserId, input),
      ).rejects.toMatchObject({ category: "FORBIDDEN" });
    });
  });
});
