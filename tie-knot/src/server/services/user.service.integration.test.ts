// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { buildUserInput, clearCollections } from "@/test";
import { AppError } from "@/shared/types";
import { UserModel } from "@/server/models";
import {
  createUser,
  checkEmailDuplicate,
  getUserEmail,
  getUserById,
  changePassword,
} from "./user.service";

describe("user.service", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("createUser", () => {
    it("유저를 생성한다", async () => {
      const input = buildUserInput();

      const created = await createUser(input);

      expect(created.email).toBe(input.email);
      const saved = await UserModel.findOne({ email: input.email });
      expect(saved).not.toBeNull();
    });
  });

  describe("checkEmailDuplicate", () => {
    it("이미 존재하는 이메일이면 true를 리턴한다", async () => {
      const input = buildUserInput();
      await UserModel.create(input);

      const result = await checkEmailDuplicate(input.email);

      expect(result).toBe(true);
    });

    it("존재하지 않는 이메일이면 false를 리턴한다", async () => {
      const result = await checkEmailDuplicate("no-such-user@example.com");

      expect(result).toBe(false);
    });
  });

  describe("getUserEmail", () => {
    it("name/phone이 일치하는 유저의 이메일을 리턴한다", async () => {
      const input = buildUserInput();
      await UserModel.create(input);

      const email = await getUserEmail({ name: input.name, phone: input.phone });

      expect(email).toBe(input.email);
    });

    it("일치하는 유저가 없으면 AppError(NOT_FOUND)를 던진다", async () => {
      await expect(getUserEmail({ name: "없는사람", phone: "010-0000-0000" })).rejects.toBeInstanceOf(
        AppError,
      );
      await expect(
        getUserEmail({ name: "없는사람", phone: "010-0000-0000" }),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
    });
  });

  describe("getUserById", () => {
    it("id로 유저를 조회한다", async () => {
      const input = buildUserInput();
      const saved = await UserModel.create(input);

      const result = await getUserById(saved._id.toString());

      expect(result.email).toBe(input.email);
    });

    it("존재하지 않는 id면 AppError(NOT_FOUND)를 던진다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      await expect(getUserById(missingId)).rejects.toBeInstanceOf(AppError);
      await expect(getUserById(missingId)).rejects.toMatchObject({ category: "NOT_FOUND" });
    });
  });

  describe("changePassword", () => {
    it("비밀번호를 해싱해 갱신하고 true를 리턴한다", async () => {
      const input = buildUserInput({ password: "old-hashed" });
      await UserModel.create(input);

      const result = await changePassword(input.email, "new-plain-password");

      expect(result).toBe(true);
      const updated = await UserModel.findOne({ email: input.email });
      expect(updated?.password).not.toBe("old-hashed");
      expect(updated?.password).not.toBe("new-plain-password");
    });

    it("존재하지 않는 이메일이면 false를 리턴한다", async () => {
      const result = await changePassword("no-such-user@example.com", "new-password");

      expect(result).toBe(false);
    });

    it("탈퇴(isDelete: true)한 유저는 갱신되지 않는다", async () => {
      const input = buildUserInput({ isDelete: true });
      await UserModel.create(input);

      const result = await changePassword(input.email, "new-password");

      expect(result).toBe(false);
    });
  });
});
