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
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const first = await dbConnect();
    const spy = vi.spyOn(mongoose, "connect");

    const second = await dbConnect();

    expect(second).toBe(first);
    expect(spy).not.toHaveBeenCalled();
    // 캐시 재사용 시 재연결 로직(로그 포함)을 다시 안 타는지까지 검증 —
    // 재사용 없이 매번 await/log를 반복하면 이 값이 2 이상으로 늘어난다.
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("MongoDB Connected");

    logSpy.mockRestore();
  });

  it("연결이 진행 중일 때 동시에 호출해도 mongoose.connect를 한 번만 호출한다", async () => {
    const spy = vi.spyOn(mongoose, "connect");

    const [first, second] = await Promise.all([dbConnect(), dbConnect()]);

    expect(second).toBe(first);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.any(String), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  });

  it("연결 실패 시 에러를 던지고 캐시된 promise를 정리한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(mongoose, "connect").mockRejectedValueOnce(new Error("연결 실패"));

    await expect(dbConnect()).rejects.toThrow("연결 실패");
    expect(global.mongooseCache.promise).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith("MongoDB Connected Fail", "연결 실패");

    errorSpy.mockRestore();
  });

  it("Error 인스턴스가 아닌 값으로 실패하면 console.error를 호출하지 않는다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(mongoose, "connect").mockRejectedValueOnce("연결 실패 문자열");

    await expect(dbConnect()).rejects.toBe("연결 실패 문자열");
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
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

    // 두 guard의 에러 메시지가 둘 다 "MONGO_TEST_URI"를 언급해서 이 substring만으로는
    // 어느 guard가 던졌는지 구분이 안 된다 — 첫 번째 guard 고유 문구로 특정한다.
    await expect(import("./connect")).rejects.toThrow(
      "테스트 환경에서 MONGO_TEST_URI 없이 실행됨",
    );
  });

  it("MONGO_TEST_URI도 DB_USER/DB_PASSWORD도 없으면 에러를 던진다", async () => {
    vi.stubEnv("VITEST", "");
    vi.stubEnv("MONGO_TEST_URI", "");
    vi.stubEnv("DB_USER", "");
    vi.stubEnv("DB_PASSWORD", "");

    await expect(import("./connect")).rejects.toThrow("MongoDB 연결 정보");
  });

  it("MONGO_TEST_URI가 있으면 에러 없이 모듈이 로드된다", async () => {
    vi.stubEnv("MONGO_TEST_URI", "mongodb://fake-test-uri/db");

    const mod = await import("./connect");

    expect(mod.dbConnect).toBeTypeOf("function");
  });

  it("VITEST 환경이 아니고 DB_USER/DB_PASSWORD가 있으면 에러 없이 모듈이 로드된다", async () => {
    vi.stubEnv("VITEST", "");
    vi.stubEnv("MONGO_TEST_URI", "");
    vi.stubEnv("DB_USER", "test-user");
    vi.stubEnv("DB_PASSWORD", "test-password");

    const mod = await import("./connect");

    expect(mod.dbConnect).toBeTypeOf("function");
  });
});
