import { ComingSoonPage } from "@/client/components/organisms";
import { routes } from "@/shared/constants";

// mock UI만 구현 — 실제 폼은 배송지 데이터 요구사항(주소 형식, 배송비 계산 여부 등)을 실물 상품 카테고리가 추가되는 시점에 확정하고 나서 만든다. 모른 채 먼저 만들면 요구사항 확정 후 다시 갈아엎는다.
export default function DeliveryInfoPage() {
  return (
    <ComingSoonPage
      title={
        <>
          배송지 입력 페이지를 <br /> 준비하고 있습니다
        </>
      }
      description={
        <>
          답례품·웨딩소품 등 실물 상품을
          <br />
          맞이할 준비를 하고 있어요.
          <br />
          지금은 모바일 청첩장만 이용 가능합니다.
        </>
      }
      secondaryLink={{ href: routes.products.root, label: "모바일 청첩장 보러가기" }}
    />
  );
}
