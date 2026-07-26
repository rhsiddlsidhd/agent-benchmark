import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildFeatureInput } from "@/test/factories/feature.factory";
import { FeatureModel } from "@/server/models";
import {
  createPremiumFeatureService,
  getAllPremiumFeatureService,
  getPremiumFeatureService,
  updatePremiumFeatureService,
} from "./premiumFeature.service";

describe("premiumFeature.service", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("createPremiumFeatureService", () => {
    it("정상 데이터로 프리미엄 기능을 생성한다", async () => {
      const input = buildFeatureInput();

      const created = await createPremiumFeatureService(input);

      expect(created.code).toBe(input.code);
      const saved = await FeatureModel.findOne({ code: input.code }).lean();
      expect(saved).not.toBeNull();
    });
  });

  describe("getAllPremiumFeatureService", () => {
    it("IFeature 기반으로 매핑된 PremiumFeature 목록을 리턴한다", async () => {
      await createPremiumFeatureService(buildFeatureInput({ code: "GUESTBOOK" }));
      await createPremiumFeatureService(
        buildFeatureInput({ code: "MAP", label: "지도", description: "오시는 길 지도를 추가합니다." }),
      );

      const result = await getAllPremiumFeatureService();

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.code).sort()).toEqual(["GUESTBOOK", "MAP"]);
      expect(typeof result[0]._id).toBe("string");
      expect(typeof result[0].createdAt).toBe("string");
    });

    it("description이 없으면 빈 문자열로 매핑한다", async () => {
      await FeatureModel.create({
        code: "NO_DESC",
        label: "설명없음",
        additionalPrice: 1000,
      });

      const result = await getAllPremiumFeatureService();

      expect(result[0].description).toBe("");
    });
  });

  describe("getPremiumFeatureService", () => {
    it("빈 배열을 받으면 DB 조회 없이 빈 배열을 리턴한다", async () => {
      const result = await getPremiumFeatureService([]);

      expect(result).toEqual([]);
    });

    it("id 목록에 해당하는 기능만 리턴한다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());
      await createPremiumFeatureService(
        buildFeatureInput({ code: "OTHER", label: "다른기능", description: "다른 기능 설명입니다." }),
      );

      const result = await getPremiumFeatureService([String(created._id)]);

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe(created.code);
    });
  });

  describe("updatePremiumFeatureService", () => {
    it("정상 수정하면 갱신된 문서를 리턴한다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());

      const updated = await updatePremiumFeatureService(String(created._id), {
        ...buildFeatureInput(),
        label: "수정된 라벨",
      });

      expect(updated?.label).toBe("수정된 라벨");
    });

    it("존재하지 않는 id면 null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await updatePremiumFeatureService(missingId, buildFeatureInput());

      expect(result).toBeNull();
    });
  });
});
