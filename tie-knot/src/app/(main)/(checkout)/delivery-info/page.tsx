import { ComingSoonPage } from "@/client/components/organisms";
import { routes } from "@/shared/constants";

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
