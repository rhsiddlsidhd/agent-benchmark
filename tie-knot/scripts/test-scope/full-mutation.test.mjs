import path from "node:path";
import { describe, expect, it } from "vitest";
import { fullMutationPaths } from "./full-mutation.mjs";

describe("full mutation storage", () => {
  it("기본 report와 incremental baseline을 XDG state 아래에서 분리한다", () => {
    expect(fullMutationPaths({ XDG_STATE_HOME: "/state" }, "/home/user")).toEqual({
      root: path.join("/state", "tie-knot", "mutation", "full"),
      latest: path.join("/state", "tie-knot", "mutation", "full", "latest"),
      incremental: path.join("/state", "tie-knot", "mutation", "full", "incremental.json"),
    });
  });

  it("CI가 report와 baseline 경로를 명시적으로 재정의할 수 있다", () => {
    expect(fullMutationPaths({ STRYKER_REPORT_DIR: "reports/full", STRYKER_INCREMENTAL_FILE: "reports/baseline.json" }, "/home/user")).toMatchObject({
      latest: "reports/full",
      incremental: "reports/baseline.json",
    });
  });
});
