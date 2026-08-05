import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { useProductSearchMock } = vi.hoisted(() => ({
  useProductSearchMock: vi.fn(),
}));

vi.mock("../_hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../_hooks")>();
  return {
    ...actual,
    useProductSearch: useProductSearchMock,
  };
});

vi.mock("@/client/components/organisms", () => ({
  ProductGrid: ({ data }: { data: unknown[] }) => (
    <div data-testid="product-grid">{data.length}건</div>
  ),
}));

import { ProductSearch } from "./ProductSearch";

describe("ProductSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("IDLE: 입력이 비어있으면 안내 문구를 보여준다", () => {
    useProductSearchMock.mockReturnValue({
      products: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      isIdle: true,
    });

    render(<ProductSearch />);

    expect(screen.getByText("검색어를 입력해주세요")).toBeInTheDocument();
  });

  it("ERROR: 서버가 준 메시지를 그대로 렌더한다", () => {
    useProductSearchMock.mockReturnValue({
      products: undefined,
      error: { category: "INTERNAL", message: "서버 오류가 발생했습니다." },
      isLoading: false,
      isValidating: false,
      isIdle: false,
    });

    render(<ProductSearch />);

    expect(
      screen.getByText("서버 오류가 발생했습니다."),
    ).toBeInTheDocument();
  });

  it("LOADING: isLoading이면 안내 문구/그리드가 아니라 로딩 표시를 보여준다", () => {
    useProductSearchMock.mockReturnValue({
      products: undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
      isIdle: false,
    });

    render(<ProductSearch />);

    expect(screen.queryByText("검색어를 입력해주세요")).not.toBeInTheDocument();
    expect(screen.queryByText("검색결과가 없습니다")).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-grid")).not.toBeInTheDocument();
  });

  it("EMPTY: 0건이면 SearchEmptyState를 렌더한다", () => {
    useProductSearchMock.mockReturnValue({
      products: [],
      error: undefined,
      isLoading: false,
      isValidating: false,
      isIdle: false,
    });

    render(<ProductSearch />);

    expect(screen.getByText("검색결과가 없습니다")).toBeInTheDocument();
  });

  it("SUCCESS: 결과가 있으면 ProductGrid를 렌더한다", () => {
    useProductSearchMock.mockReturnValue({
      products: [{ _id: "1" }],
      error: undefined,
      isLoading: false,
      isValidating: false,
      isIdle: false,
    });

    render(<ProductSearch />);

    expect(screen.getByTestId("product-grid")).toHaveTextContent("1건");
  });

  it("keepPreviousData로 이전 0건 결과가 남아있어도 재검증 중엔 EMPTY가 아니라 로딩으로 판정한다", () => {
    useProductSearchMock.mockReturnValue({
      products: [],
      error: undefined,
      isLoading: false,
      isValidating: true,
      isIdle: false,
    });

    render(<ProductSearch />);

    expect(screen.queryByText("검색결과가 없습니다")).not.toBeInTheDocument();
  });

  it("타이핑하면 SearchBar의 value가 갱신된다", async () => {
    useProductSearchMock.mockReturnValue({
      products: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      isIdle: true,
    });

    render(<ProductSearch />);
    const input = screen.getByRole("searchbox", { name: "상품 검색" });

    await userEvent.type(input, "청첩장");

    expect(input).toHaveValue("청첩장");
  });
});
