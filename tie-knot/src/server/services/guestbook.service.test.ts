import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildGuestbookInput } from "@/test/factories/guestbook.factory";
import { AppError } from "@/shared/types";
import {
  createGuestbookService,
  getGuestbookService,
  getPrivateGuestbookService,
  deleteGuestbookService,
} from "./guestbook.service";

describe("guestbook.service", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("createGuestbookService", () => {
    it("정상 데이터로 방명록을 생성한다", async () => {
      const input = buildGuestbookInput();

      const result = await createGuestbookService({ data: input });

      expect(result.author).toBe(input.author);
    });

    it("필수 필드 누락으로 mongoose 검증 실패 시 AppError(INTERNAL)를 던진다", async () => {
      const input = buildGuestbookInput({
        author: undefined as unknown as string,
      });

      await expect(
        createGuestbookService({ data: input }),
      ).rejects.toBeInstanceOf(AppError);
      await expect(
        createGuestbookService({ data: input }),
      ).rejects.toMatchObject({ category: "INTERNAL" });
    });
  });

  describe("getGuestbookService", () => {
    it("coupleInfoId로 방명록 목록을 조회한다", async () => {
      const input = buildGuestbookInput();
      await createGuestbookService({ data: input });

      const result = await getGuestbookService(input.coupleInfoId);

      expect(result).toHaveLength(1);
      expect(result[0].author).toBe(input.author);
    });

    it("id 형식이 잘못되면 빈 배열을 리턴한다", async () => {
      const result = await getGuestbookService("not-a-valid-id");

      expect(result).toEqual([]);
    });
  });

  describe("getPrivateGuestbookService", () => {
    it("존재하는 id면 방명록을 리턴한다", async () => {
      const input = buildGuestbookInput();
      const created = await createGuestbookService({ data: input });

      const result = await getPrivateGuestbookService(
        created._id.toString(),
      );

      expect(result?.author).toBe(input.author);
    });

    it("존재하지 않는 id면 null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await getPrivateGuestbookService(missingId);

      expect(result).toBeNull();
    });

    it("id 형식이 잘못되면 null을 리턴한다", async () => {
      const result = await getPrivateGuestbookService("not-a-valid-id");

      expect(result).toBeNull();
    });
  });

  describe("deleteGuestbookService", () => {
    it("정상 삭제하면 deletedCount 1을 리턴한다", async () => {
      const input = buildGuestbookInput();
      const created = await createGuestbookService({ data: input });

      const result = await deleteGuestbookService(created._id.toString());

      expect(result.deletedCount).toBe(1);
    });

    it("id 형식이 잘못되면 deletedCount 0을 리턴한다", async () => {
      const result = await deleteGuestbookService("not-a-valid-id");

      expect(result).toEqual({ acknowledged: false, deletedCount: 0 });
    });
  });
});
