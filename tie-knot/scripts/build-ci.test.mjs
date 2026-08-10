import { describe, expect, it, vi } from "vitest";
import { runBuildWithMemoryMongo } from "./build-ci.mjs";

describe("CI production build MongoDB 격리", () => {
  it("memory MongoDB URI로 build를 실행하고 성공해도 서버를 정리한다", async () => {
    const stop = vi.fn();
    const run = vi.fn(async () => 0);

    const status = await runBuildWithMemoryMongo({
      createMongo: async () => ({ getUri: () => "mongodb://memory/test", stop }),
      run,
    });

    expect(run).toHaveBeenCalledWith("mongodb://memory/test");
    expect(stop).toHaveBeenCalledOnce();
    expect(status).toBe(0);
  });

  it("build 실행이 실패해도 memory MongoDB를 정리한다", async () => {
    const stop = vi.fn();

    await expect(runBuildWithMemoryMongo({
      createMongo: async () => ({ getUri: () => "mongodb://memory/test", stop }),
      run: () => { throw new Error("build failed"); },
    })).rejects.toThrow("build failed");
    expect(stop).toHaveBeenCalledOnce();
  });
});
