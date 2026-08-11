import { describe, expect, it } from "vitest";
import reportModule from "../report/scan.js";
import { resolve } from "../verify/alias-loader.mjs";
import authModule from "../verify/auth.js";
import checksModule from "../verify/checks.js";
import cliModule from "../verify/cli.js";
import envModule from "../verify/env.js";
import "../verify/register-loader.js";
import schemasModule from "../verify/schemas.js";
import serverModule from "../verify/server.js";
import { NextResponse } from "../verify/stubs/next-server.mjs";

describe("API contract 스크립트 경계", () => {
  it("새 report 경로에서 프로젝트 API route를 탐색한다", () => {
    const report = reportModule.buildReport();

    expect(report.summary.internalRoutesDefined).toBeGreaterThan(0);
    expect(report.internalRoutes).toEqual(
      expect.arrayContaining([expect.objectContaining({ routePath: "/api/products" })]),
    );
  });

  it("verify 모듈의 공개 계약과 프로젝트 root를 유지한다", () => {
    expect(resolve).toBeTypeOf("function");
    expect(authModule.getCookieHeader).toBeTypeOf("function");
    expect(checksModule.buildChecks).toBeTypeOf("function");
    expect(cliModule.warnForMissingPreviewInfo).toBeTypeOf("function");
    expect(envModule.loadEnv).toBeTypeOf("function");
    expect(schemasModule.loadDataSchemas).toBeTypeOf("function");
    expect(serverModule.ensureDevServer).toBeTypeOf("function");
    expect(serverModule.repoRoot).toBe(process.cwd());
    expect(new NextResponse()).toBeInstanceOf(NextResponse);
  });
});
