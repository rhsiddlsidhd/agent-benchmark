export type PagePath = "payment" | "delivery-info";

export const PAGE_TITLE: Record<PagePath, { title: string; subTitle: string }> =
  {
    payment: {
      title: "주문하기",
      subTitle: "안전하고 빠른 결제를 진행해주세요",
    },
    "delivery-info": {
      title: "전송 정보 입력",
      subTitle: "상품/청첩장을 받을 이메일 또는 주소를 정확히 입력해주세요",
    },
  };
