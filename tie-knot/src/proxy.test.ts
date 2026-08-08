// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { encrypt } from "@/server/lib/jose";
import proxy from "./proxy";

const buildRequest = (path: string, token?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers.cookie = `token=${token}`;
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
};

const isNext = (res: Response) => res.headers.get("x-middleware-next") === "1";
const redirectsTo = (res: Response, path: string) => {
  const location = res.headers.get("location");
  return location !== null && new URL(location).pathname === path;
};

describe("proxy", () => {
  describe("protected path", () => {
    it("token 쿠키가 없으면 /login으로 리다이렉트한다", async () => {
      const res = await proxy(buildRequest("/my-orders"));

      expect(redirectsTo(res, "/login")).toBe(true);
    });

    it("token이 유효하면 통과시킨다", async () => {
      const token = await encrypt({ id: "user-1", role: "USER", type: "REFRESH" });

      const res = await proxy(buildRequest("/my-orders", token));

      expect(isNext(res)).toBe(true);
    });

    it("token이 만료/변조됐으면 /login으로 리다이렉트한다", async () => {
      const res = await proxy(buildRequest("/my-profile", "invalid-token"));

      expect(redirectsTo(res, "/login")).toBe(true);
    });
  });

  describe("admin 라우트", () => {
    it("token이 없으면 /login으로 리다이렉트한다", async () => {
      const res = await proxy(buildRequest("/admin/dashboard"));

      expect(redirectsTo(res, "/login")).toBe(true);
    });

    it("role이 ADMIN이 아니면 /로 리다이렉트한다", async () => {
      const token = await encrypt({ id: "user-1", role: "USER", type: "REFRESH" });

      const res = await proxy(buildRequest("/admin/dashboard", token));

      expect(redirectsTo(res, "/")).toBe(true);
    });

    it("role이 ADMIN이면 통과시킨다", async () => {
      const token = await encrypt({ id: "admin-1", role: "ADMIN", type: "REFRESH" });

      const res = await proxy(buildRequest("/admin/dashboard", token));

      expect(isNext(res)).toBe(true);
    });
  });

  describe("/login", () => {
    it("entry 쿠키 없이도 통과시킨다(entry 게이트 폐기)", async () => {
      const res = await proxy(buildRequest("/login"));

      expect(isNext(res)).toBe(true);
    });

    it("이미 로그인한 유저는 /로 리다이렉트한다", async () => {
      const token = await encrypt({ id: "user-1", role: "USER", type: "REFRESH" });

      const res = await proxy(buildRequest("/login", token));

      expect(redirectsTo(res, "/")).toBe(true);
    });
  });

  describe("/change-password", () => {
    it("t 파라미터가 없으면 /로 리다이렉트한다", async () => {
      const res = await proxy(buildRequest("/change-password"));

      expect(redirectsTo(res, "/")).toBe(true);
    });

    it("t 파라미터가 있으면 통과시킨다", async () => {
      const res = await proxy(buildRequest("/change-password?t=abc"));

      expect(isNext(res)).toBe(true);
    });
  });
});
