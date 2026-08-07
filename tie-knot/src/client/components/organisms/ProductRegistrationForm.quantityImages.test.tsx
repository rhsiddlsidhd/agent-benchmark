import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductRegistrationForm } from "./ProductRegistrationForm";

// REQ-6 검증을 위해 이 파일에서만 카테고리 옵션에 invitation이 아닌 항목을 추가한다 —
// 실제 category.ts(REQ-1, backend-impl 담당)와 무관하게 selectedCategory 조건부 렌더
// 로직 자체(문자열 비교)를 검증하기 위한 격리된 목이다.
vi.mock("@/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/utils")>();
  return {
    ...actual,
    getCategoryOptions: () => [
      { value: "invitation", label: "초대장" },
      { value: "favor", label: "답례품" },
    ],
    getSubCategoryOptions: (category: string) =>
      category === "invitation"
        ? [{ value: "wedding", label: "청첩장" }]
        : [{ value: "candle", label: "캔들" }],
  };
});

const renderForm = () =>
  render(
    <ProductRegistrationForm
      premiumFeatures={[]}
      action={vi.fn()}
      pending={false}
      state={null}
      onCancel={vi.fn()}
    />,
  );

describe("ProductRegistrationForm — REQ-6 invitation 전용 필드 조건부 렌더", () => {
  it("카테고리가 invitation이면 테마/미리보기 카드가 보인다", () => {
    renderForm();

    expect(screen.getByText("테마")).toBeInTheDocument();
    expect(screen.getByText("미리보기 이미지")).toBeInTheDocument();
  });

  it("invitation이 아닌 카테고리로 바꾸면 테마/미리보기 카드가 사라진다", async () => {
    const user = userEvent.setup();
    renderForm();

    const categoryTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("카테고리를 선택하세요") || el.textContent?.includes("초대장"));
    await user.click(categoryTrigger!);
    await user.click(await screen.findByRole("option", { name: "답례품" }));

    expect(screen.queryByText("테마")).not.toBeInTheDocument();
    expect(screen.queryByText("미리보기 이미지")).not.toBeInTheDocument();
  });

  it("invitation이 아니면 상세 이미지 카드에 필수(*) 표시가 붙는다", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByText("상세 이미지")).toBeInTheDocument(); // invitation: 선택사항, asterisk 없음

    const categoryTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("카테고리를 선택하세요") || el.textContent?.includes("초대장"));
    await user.click(categoryTrigger!);
    await user.click(await screen.findByRole("option", { name: "답례품" }));

    expect(screen.getByText("상세 이미지 *")).toBeInTheDocument();
  });
});

describe("ProductRegistrationForm — 상세 이미지 갤러리(REQ-2/3)", () => {
  it("이미지를 업로드하면 갤러리에 미리보기가 추가된다", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = new File(["x"], "gallery.png", { type: "image/png" });
    const input = document.getElementById("images-upload") as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByAltText(/Preview/)).toBeInTheDocument();
  });

  it("images 필드 에러가 있으면 갤러리 하단에 렌더된다", () => {
    render(
      <ProductRegistrationForm
        premiumFeatures={[]}
        action={vi.fn()}
        pending={false}
        state={{
          success: false,
          error: {
            category: "VALIDATION",
            message: "입력값을 확인해주세요",
            fieldErrors: { images: ["상세 이미지를 1장 이상 등록해주세요."] },
          },
        }}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("상세 이미지를 1장 이상 등록해주세요.")).toBeInTheDocument();
  });
});

describe("ProductRegistrationForm — 구매 수량(REQ-2/3, §3-4 무제한 체크박스 상태머신)", () => {
  it("초기값은 최소 1 / 무제한 체크됨(maxQuantity hidden=0)이다", () => {
    const { container } = renderForm();

    expect(screen.getByLabelText("최소 구매 수량 *")).toHaveValue(1);
    expect(screen.getByPlaceholderText("무제한")).toBeDisabled();

    const hidden = container.querySelector(
      'input[type="hidden"][name="maxQuantity"]',
    ) as HTMLInputElement;
    expect(hidden.value).toBe("0");
    // 활성 숫자 Input과 hidden이 동시에 name="maxQuantity"로 존재하면 안 된다.
    expect(container.querySelectorAll('[name="maxQuantity"]')).toHaveLength(1);
  });

  it("무제한 체크를 해제하면 숫자 Input이 활성화되고 hidden이 사라진다", async () => {
    const user = userEvent.setup();
    const { container } = renderForm();

    await user.click(screen.getByLabelText("무제한"));

    const active = screen.getByLabelText("최대 구매 수량 *") as HTMLInputElement;
    expect(active).not.toBeDisabled();
    expect(active.value).toBe("1");
    expect(container.querySelectorAll('[name="maxQuantity"]')).toHaveLength(1);
    expect(container.querySelector('input[type="hidden"][name="maxQuantity"]')).toBeNull();
  });

  it("최소 구매 수량을 바꾼 뒤 무제한을 해제하면 최대 구매 수량 기본값이 그 값을 따라간다", async () => {
    const user = userEvent.setup();
    renderForm();

    const min = screen.getByLabelText("최소 구매 수량 *");
    await user.clear(min);
    await user.type(min, "5");

    await user.click(screen.getByLabelText("무제한"));

    expect(screen.getByLabelText("최대 구매 수량 *")).toHaveValue(5);
  });

  it("minQuantity/maxQuantity 필드 에러가 각각 렌더된다", () => {
    render(
      <ProductRegistrationForm
        premiumFeatures={[]}
        action={vi.fn()}
        pending={false}
        state={{
          success: false,
          error: {
            category: "VALIDATION",
            message: "입력값을 확인해주세요",
            fieldErrors: {
              minQuantity: ["최소 구매 수량은 1 이상이어야 합니다."],
              maxQuantity: ["최대 구매 수량은 최소 구매 수량보다 크거나 같아야 합니다."],
            },
          },
        }}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("최소 구매 수량은 1 이상이어야 합니다.")).toBeInTheDocument();
    expect(
      screen.getByText("최대 구매 수량은 최소 구매 수량보다 크거나 같아야 합니다."),
    ).toBeInTheDocument();
  });
});
