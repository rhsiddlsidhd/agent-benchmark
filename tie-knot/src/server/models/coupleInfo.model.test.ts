import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { CoupleInfoModel } from "./coupleInfo.model";

const buildCoupleInfo = (overrides?: Record<string, unknown>) => ({
  userId: new mongoose.Types.ObjectId(),
  groom: { name: "김철수", phone: "010-1111-2222" },
  bride: { name: "이영희", phone: "010-3333-4444" },
  weddingDate: new Date("2026-12-25"),
  venue: "그랜드 웨딩홀",
  address: "서울시 강남구",
  addressDetail: "3층",
  guestbookEnabled: true,
  thumbnailImages: [] as string[],
  galleryImages: [] as string[],
  ...overrides,
});

describe("CoupleInfoModel", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("필수 필드가 다 있으면 생성된다", async () => {
    const coupleInfo = await CoupleInfoModel.create(buildCoupleInfo());

    expect(coupleInfo.venue).toBe("그랜드 웨딩홀");
    expect(coupleInfo.guestbookEnabled).toBe(true);
  });

  it("venue 없이 생성하면 검증 에러를 던진다", async () => {
    await expect(
      CoupleInfoModel.create(buildCoupleInfo({ venue: undefined })),
    ).rejects.toThrow(/venue/);
  });

  it("groom.name 없이 생성하면 검증 에러를 던진다", async () => {
    await expect(
      CoupleInfoModel.create(
        buildCoupleInfo({ groom: { phone: "010-1111-2222" } }),
      ),
    ).rejects.toThrow(/groom/);
  });

  it("father/mother 없이도 생성된다 (선택 필드)", async () => {
    const coupleInfo = await CoupleInfoModel.create(buildCoupleInfo());

    expect(coupleInfo.groom.father).toBeUndefined();
    expect(coupleInfo.groom.mother).toBeUndefined();
  });

  it("guestbookEnabled 기본값은 false다", async () => {
    const coupleInfo = await CoupleInfoModel.create(
      buildCoupleInfo({ guestbookEnabled: undefined }),
    );

    expect(coupleInfo.guestbookEnabled).toBe(false);
  });

  it("toJSON은 __v를 제거한다", async () => {
    const coupleInfo = await CoupleInfoModel.create(buildCoupleInfo());

    expect(coupleInfo.toJSON()).not.toHaveProperty("__v");
  });
});
