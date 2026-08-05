import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product } from "@/server/services";

vi.mock("@/client/components/organisms", () => ({
  EcommerceHero: () => <div>hero</div>,
  TemplateCarouselGroup: ({ title }: { title: string }) => <div>{title}</div>,
  LiveDemoSection: ({ infoId }: { infoId: string }) => <div>live-demo-{infoId}</div>,
  StartActionCTA: () => <div>cta</div>,
}));

import { HomeTemplate } from "./HomeTemplate";

const buildProduct = (): Product => ({ title: "봄맞이 청첩장" }) as Product;

describe("HomeTemplate", () => {
  it("hero와 cta는 항상 렌더링한다", () => {
    render(<HomeTemplate invitation={[]} product={null} infoId={undefined} />);

    expect(screen.getByText("hero")).toBeInTheDocument();
    expect(screen.getByText("cta")).toBeInTheDocument();
  });

  it("invitation이 있으면 추천 템플릿 섹션을 렌더링한다", () => {
    render(
      <HomeTemplate invitation={[buildProduct()]} product={null} infoId={undefined} />,
    );

    expect(screen.getByText("초대장")).toBeInTheDocument();
  });

  it("invitation이 비어있으면 추천 템플릿 섹션을 렌더링하지 않는다", () => {
    render(<HomeTemplate invitation={[]} product={null} infoId={undefined} />);

    expect(screen.queryByText("초대장")).not.toBeInTheDocument();
  });

  it("product와 infoId가 모두 있으면 라이브 데모 섹션을 렌더링한다", () => {
    render(
      <HomeTemplate invitation={[]} product={buildProduct()} infoId="info-1" />,
    );

    expect(screen.getByText("live-demo-info-1")).toBeInTheDocument();
  });

  it("infoId가 없으면 라이브 데모 섹션을 렌더링하지 않는다", () => {
    render(
      <HomeTemplate invitation={[]} product={buildProduct()} infoId={undefined} />,
    );

    expect(screen.queryByText(/live-demo-/)).not.toBeInTheDocument();
  });
});
