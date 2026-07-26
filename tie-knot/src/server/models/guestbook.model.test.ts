import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { GuestbookModel } from "./guestbook.model";

describe("GuestbookModel", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("timestamps로 createdAt/updatedAt을 둘 다 생성한다", async () => {
    const guestbook = await GuestbookModel.create({
      coupleInfoId: new mongoose.Types.ObjectId(),
      author: "하객1",
      password: "1234",
      message: "축하합니다",
      isPrivate: false,
    });

    expect(guestbook.createdAt).toBeInstanceOf(Date);
    expect(guestbook.updatedAt).toBeInstanceOf(Date);
  });
});
