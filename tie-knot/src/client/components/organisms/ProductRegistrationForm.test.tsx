import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductRegistrationForm } from "./ProductRegistrationForm";
import { PremiumFeature } from "@/server/services";

const buildFeature = (overrides?: Partial<PremiumFeature>): PremiumFeature => ({
  _id: "feature-1",
  code: "GUESTBOOK",
  label: "방명록",
  description: "방명록 기능",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("ProductRegistrationForm", () => {
  const renderForm = (premiumFeatures: PremiumFeature[] = []) =>
    render(
      <ProductRegistrationForm
        premiumFeatures={premiumFeatures}
        action={vi.fn()}
        pending={false}
        state={null}
        onCancel={vi.fn()}
      />,
    );

  it("기본 정보 입력 필드를 렌더링한다", () => {
    renderForm();

    expect(screen.getByLabelText(/상품명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/상품 설명/)).toBeInTheDocument();
    expect(screen.getByText("카테고리(대분류)")).toBeInTheDocument();
    expect(screen.getByText("서브 카테고리")).toBeInTheDocument();
  });

  it("테마 선택 필드가 기본값 '기본'으로 렌더링된다", () => {
    renderForm();

    expect(screen.getByText("테마")).toBeInTheDocument();
    const themeTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("기본"));
    expect(themeTrigger).toBeDefined();
  });

  it("테마를 변경하면 선택한 테마로 표시가 바뀐다", async () => {
    const user = userEvent.setup();
    renderForm();

    const themeTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("기본"));
    expect(themeTrigger).toBeDefined();

    await user.click(themeTrigger!);
    await user.click(await screen.findByRole("option", { name: "벚꽃" }));

    expect(themeTrigger!.textContent).toContain("벚꽃");
  });

  it("썸네일을 업로드하면 미리보기가 뜨고, 삭제하면 업로드 안내로 되돌아간다", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = new File(["x"], "thumb.png", { type: "image/png" });
    const input = document.getElementById("thumbnail-input") as HTMLInputElement;
    await user.upload(input, file);

    const image = await screen.findByAltText("Thumbnail");
    expect(image).toBeInTheDocument();

    const removeButton = within(image.closest("div")!).getByRole("button");
    await user.click(removeButton);

    expect(screen.queryByAltText("Thumbnail")).not.toBeInTheDocument();
    expect(screen.getAllByText("클릭하여 이미지 업로드").length).toBeGreaterThan(0);
  });

  it("미리보기 이미지를 업로드하면 미리보기가 뜨고, 삭제하면 업로드 안내로 되돌아간다", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = new File(["x"], "preview.png", { type: "image/png" });
    const input = document.getElementById("preview-input") as HTMLInputElement;
    await user.upload(input, file);

    const image = await screen.findByAltText("Preview");
    expect(image).toBeInTheDocument();

    const removeButton = within(image.closest("div")!).getByRole("button");
    await user.click(removeButton);

    expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
  });

  it("프리미엄 스위치를 켜면 옵션 체크박스가 나타나고, 체크하면 featureIds hidden input이 추가된다", async () => {
    const user = userEvent.setup();
    const { container } = renderForm([buildFeature()]);

    await user.click(screen.getByRole("switch", { name: /프리미엄 상품/ }));
    expect(screen.getByText("프리미엄 기능 선택")).toBeInTheDocument();

    await user.click(screen.getByLabelText("방명록"));

    const hiddenInput = container.querySelector(
      'input[name="featureIds"][value="feature-1"]',
    );
    expect(hiddenInput).not.toBeNull();

    await user.click(screen.getByLabelText("방명록"));
    expect(
      container.querySelector('input[name="featureIds"][value="feature-1"]'),
    ).toBeNull();
  });

  it("프리미엄 스위치를 끄면 선택된 옵션이 초기화된다", async () => {
    const user = userEvent.setup();
    renderForm([buildFeature()]);

    const premiumSwitch = screen.getByRole("switch", { name: /프리미엄 상품/ });
    await user.click(premiumSwitch);
    await user.click(screen.getByLabelText("방명록"));
    await user.click(premiumSwitch);

    expect(screen.queryByText("프리미엄 기능 선택")).not.toBeInTheDocument();
  });

  it("필드 에러가 있으면 각 필드 아래에 에러 메시지를 렌더링한다", () => {
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
              title: ["상품명을 입력해주세요."],
              description: ["상품 설명은 최소 10자 이상이어야 합니다."],
              price: ["가격은 0 이상이어야 합니다."],
              priority: ["우선순위 오류"],
              thumbnail: ["썸네일 이미지를 등록해주세요."],
              featureIds: ["옵션을 선택해주세요."],
            },
          },
        }}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("상품명을 입력해주세요.")).toBeInTheDocument();
    expect(
      screen.getByText("상품 설명은 최소 10자 이상이어야 합니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("가격은 0 이상이어야 합니다.")).toBeInTheDocument();
    expect(screen.getByText("우선순위 오류")).toBeInTheDocument();
    expect(screen.getByText("썸네일 이미지를 등록해주세요.")).toBeInTheDocument();
  });

  it("에러가 없으면 에러 메시지를 렌더링하지 않는다", () => {
    renderForm();

    expect(screen.queryByText("상품명을 입력해주세요.")).not.toBeInTheDocument();
  });

  it("할인 방식을 금액으로 바꾸면 단위 표시가 '원'으로 바뀐다", async () => {
    const user = userEvent.setup();
    renderForm();

    const discountTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("비율"));
    expect(discountTrigger).toBeDefined();

    await user.click(discountTrigger!);
    await user.click(await screen.findByRole("option", { name: "금액 (원)" }));

    expect(screen.getByText("차감 금액 입력")).toBeInTheDocument();
  });

  it("추천 상품 스위치를 켜면 hidden input isFeatured가 true로 바뀐다", async () => {
    const user = userEvent.setup();
    const { container } = renderForm();

    await user.click(screen.getByRole("switch", { name: /추천 상품/ }));

    const hidden = container.querySelector('input[name="isFeatured"]') as HTMLInputElement;
    expect(hidden.value).toBe("true");
  });

  it("취소 버튼을 클릭하면 onCancel이 호출된다", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ProductRegistrationForm
        premiumFeatures={[]}
        action={vi.fn()}
        pending={false}
        state={null}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("pending이면 등록 버튼이 비활성화되고 문구가 바뀐다", () => {
    render(
      <ProductRegistrationForm
        premiumFeatures={[]}
        action={vi.fn()}
        pending={true}
        state={null}
        onCancel={vi.fn()}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "등록 중..." });
    expect(submitButton).toBeDisabled();
  });

  it("카테고리를 변경하면 서브 카테고리 선택이 초기화된다", async () => {
    const user = userEvent.setup();
    renderForm();

    const categoryTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("초대장"));
    expect(categoryTrigger).toBeDefined();

    await user.click(categoryTrigger!);
    await user.click(await screen.findByRole("option", { name: "초대장" }));

    expect(categoryTrigger!.textContent).toContain("초대장");
  });
});
