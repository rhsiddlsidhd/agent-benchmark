// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  searchProductsService: vi.fn(),
}));

import { searchProductsService } from "@/server/services";
import { GET } from "./route";

const buildRequest = (query: string) =>
  new NextRequest(`http://localhost/api/products/search${query}`);

describe("GET /api/products/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("q 파라미터가 없으면 서비스를 undefined로 호출하고 200을 리턴한다", async () => {
    vi.mocked(searchProductsService).mockResolvedValue([]);

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: [] });
    expect(searchProductsService).toHaveBeenCalledWith(undefined);
  });

  it("q가 공백뿐이면 undefined로 정규화해 서비스를 호출한다", async () => {
    vi.mocked(searchProductsService).mockResolvedValue([]);

    const res = await GET(buildRequest("?q=%20%20"));

    expect(res.status).toBe(200);
    expect(searchProductsService).toHaveBeenCalledWith(undefined);
  });

  it("정상 검색어를 서비스에 그대로 전달하고 결과를 200으로 리턴한다", async () => {
    const mockProduct = { _id: "1", title: "돌잔치 카드" };
    vi.mocked(searchProductsService).mockResolvedValue([mockProduct] as never);

    const res = await GET(buildRequest("?q=돌잔"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: [mockProduct] });
    expect(searchProductsService).toHaveBeenCalledWith("돌잔");
  });

  it("q가 101자를 넘으면 400 VALIDATION을 리턴하고 서비스는 호출되지 않는다", async () => {
    const res = await GET(buildRequest(`?q=${"가".repeat(101)}`));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.category).toBe("VALIDATION");
    expect(searchProductsService).not.toHaveBeenCalled();
  });

  it("q가 100자면 통과한다 (경계값)", async () => {
    vi.mocked(searchProductsService).mockResolvedValue([]);

    const res = await GET(buildRequest(`?q=${"가".repeat(100)}`));

    expect(res.status).toBe(200);
    expect(searchProductsService).toHaveBeenCalledWith("가".repeat(100));
  });

  it("서비스가 AppError(INTERNAL)를 던지면 500을 리턴한다", async () => {
    vi.mocked(searchProductsService).mockRejectedValue(
      new AppError("INTERNAL", "DB 오류"),
    );

    const res = await GET(buildRequest("?q=돌잔"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it("결과가 0건이어도 200과 빈 배열을 리턴한다 (404 아님)", async () => {
    vi.mocked(searchProductsService).mockResolvedValue([]);

    const res = await GET(buildRequest("?q=존재하지않는검색어"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: [] });
  });
});
