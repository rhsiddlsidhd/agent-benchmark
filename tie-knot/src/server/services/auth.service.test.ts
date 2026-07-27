// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildUser } from "@/test/factories/user.factory";
import { AppError } from "@/shared/types";
import { UserModel } from "@/server/models";
import { encrypt } from "@/server/lib/jose";

vi.mock("@/server/lib/cookies", () => ({
  getCookie: vi.fn(),
  deleteCookie: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

import { getCookie, deleteCookie } from "@/server/lib/cookies";
import { redirect } from "next/navigation";
import { getUser, getAuth, requireAuth, logoutService, getPageAuth } from "./auth.service";

describe("auth.service", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("getUser", () => {
    it("id로 존재하는 유저를 조회한다", async () => {
      const input = buildUser();
      const saved = await UserModel.create(input);

      const result = await getUser({ id: saved._id.toString() });

      expect(result?.email).toBe(input.email);
    });

    it("email로 존재하는 유저를 조회한다", async () => {
      const input = buildUser();
      await UserModel.create(input);

      const result = await getUser({ email: input.email });

      expect(result?.name).toBe(input.name);
    });

    it("존재하지 않는 id면 null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await getUser({ id: missingId });

      expect(result).toBeNull();
    });

    it("id 형식이 잘못되면 null을 리턴한다", async () => {
      const result = await getUser({ id: "not-a-valid-id" });

      expect(result).toBeNull();
    });

    it("isDelete가 true인 유저는 조회되지 않는다", async () => {
      const input = buildUser({ isDelete: true });
      await UserModel.create(input);

      const result = await getUser({ email: input.email });

      expect(result).toBeNull();
    });
  });

  describe("getAuth", () => {
    it("token 쿠키가 없으면 null을 리턴한다", async () => {
      vi.mocked(getCookie).mockResolvedValue(undefined);

      const result = await getAuth();

      expect(result).toBeNull();
    });

    it("token 쿠키가 유효하면 DB를 재조회해 세션을 리턴한다", async () => {
      const input = buildUser({ role: "ADMIN" });
      const saved = await UserModel.create(input);
      const token = await encrypt({ id: saved._id.toString(), role: "ADMIN", type: "REFRESH" });
      vi.mocked(getCookie).mockResolvedValue({ name: "token", value: token });

      const result = await getAuth();

      expect(result).toEqual({
        role: "ADMIN",
        email: input.email,
        userId: saved._id.toString(),
      });
    });

    it("token이 만료/변조됐으면 null을 리턴한다", async () => {
      vi.mocked(getCookie).mockResolvedValue({ name: "token", value: "invalid-token" });

      const result = await getAuth();

      expect(result).toBeNull();
    });

    it("token의 유저가 DB에 없으면(탈퇴 등) null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();
      const token = await encrypt({ id: missingId, role: "USER", type: "REFRESH" });
      vi.mocked(getCookie).mockResolvedValue({ name: "token", value: token });

      const result = await getAuth();

      expect(result).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("세션이 있으면 세션을 리턴한다", async () => {
      const input = buildUser();
      const saved = await UserModel.create(input);
      const token = await encrypt({ id: saved._id.toString(), role: "USER", type: "REFRESH" });
      vi.mocked(getCookie).mockResolvedValue({ name: "token", value: token });

      const result = await requireAuth();

      expect(result.userId).toBe(saved._id.toString());
    });

    it("세션이 없으면 AppError(UNAUTHENTICATED)를 던진다", async () => {
      vi.mocked(getCookie).mockResolvedValue(undefined);

      await expect(requireAuth()).rejects.toBeInstanceOf(AppError);
      await expect(requireAuth()).rejects.toMatchObject({ category: "UNAUTHENTICATED" });
    });
  });

  describe("getPageAuth", () => {
    it("세션이 없으면 /login으로 redirect한다", async () => {
      vi.mocked(getCookie).mockResolvedValue(undefined);

      await expect(getPageAuth()).rejects.toThrow("REDIRECT:/login");
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("세션이 있고 role 요구가 없으면 세션을 리턴한다", async () => {
      const input = buildUser();
      const saved = await UserModel.create(input);
      const token = await encrypt({ id: saved._id.toString(), role: "USER", type: "REFRESH" });
      vi.mocked(getCookie).mockResolvedValue({ name: "token", value: token });

      const result = await getPageAuth();

      expect(result.userId).toBe(saved._id.toString());
      expect(redirect).not.toHaveBeenCalled();
    });

    it("role을 요구했는데 불일치하면 /로 redirect한다", async () => {
      const input = buildUser({ role: "USER" });
      const saved = await UserModel.create(input);
      const token = await encrypt({ id: saved._id.toString(), role: "USER", type: "REFRESH" });
      vi.mocked(getCookie).mockResolvedValue({ name: "token", value: token });

      await expect(getPageAuth("ADMIN")).rejects.toThrow("REDIRECT:/");
      expect(redirect).toHaveBeenCalledWith("/");
    });

    it("role이 일치하면 세션을 리턴한다", async () => {
      const input = buildUser({ role: "ADMIN" });
      const saved = await UserModel.create(input);
      const token = await encrypt({ id: saved._id.toString(), role: "ADMIN", type: "REFRESH" });
      vi.mocked(getCookie).mockResolvedValue({ name: "token", value: token });

      const result = await getPageAuth("ADMIN");

      expect(result.userId).toBe(saved._id.toString());
      expect(redirect).not.toHaveBeenCalled();
    });

    it("세션이 없으면 role 요구 여부와 무관하게 /login으로 redirect한다(순서 고정)", async () => {
      vi.mocked(getCookie).mockResolvedValue(undefined);

      await expect(getPageAuth("ADMIN")).rejects.toThrow("REDIRECT:/login");
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("logoutService", () => {
    it("token 쿠키만 삭제한다(access 쿠키 없음)", async () => {
      await logoutService();

      expect(deleteCookie).toHaveBeenCalledWith("token");
      expect(deleteCookie).toHaveBeenCalledTimes(1);
    });
  });
});
