import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect, isConnected } from "./connect";

describe("dbConnect", () => {
  afterEach(async () => {
    await mongoose.disconnect();
    global.mongooseCache.conn = null;
    global.mongooseCache.promise = null;
  });

  it("MONGO_TEST_URI로 실제 mongod(mongodb-memory-server)에 연결한다", async () => {
    await dbConnect();

    expect(isConnected()).toBe(true);
  });

  it("캐시된 연결이 있으면 재사용하고 mongoose.connect를 다시 호출하지 않는다", async () => {
    const first = await dbConnect();
    const spy = vi.spyOn(mongoose, "connect");

    const second = await dbConnect();

    expect(second).toBe(first);
    expect(spy).not.toHaveBeenCalled();
  });

  it("연결 실패 시 에러를 던지고 캐시된 promise를 정리한다", async () => {
    vi.spyOn(mongoose, "connect").mockRejectedValueOnce(new Error("연결 실패"));

    await expect(dbConnect()).rejects.toThrow("연결 실패");
    expect(global.mongooseCache.promise).toBeNull();
  });

  it("연결 전엔 false, 연결 후엔 true를 반환한다", async () => {
    expect(isConnected()).toBe(false);

    await dbConnect();

    expect(isConnected()).toBe(true);
  });
});

describe("모듈 로드 시 URI 검증", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("VITEST 환경에서 MONGO_TEST_URI 없으면 에러를 던진다", async () => {
    vi.stubEnv("MONGO_TEST_URI", "");

    await expect(import("./connect")).rejects.toThrow("MONGO_TEST_URI");
  });

  it("MONGO_TEST_URI도 DB_USER/DB_PASSWORD도 없으면 에러를 던진다", async () => {
    vi.stubEnv("VITEST", "");
    vi.stubEnv("MONGO_TEST_URI", "");
    vi.stubEnv("DB_USER", "");
    vi.stubEnv("DB_PASSWORD", "");

    await expect(import("./connect")).rejects.toThrow("MongoDB 연결 정보");
  });
});
