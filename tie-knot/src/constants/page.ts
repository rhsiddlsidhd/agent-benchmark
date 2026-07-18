export type PagePath = "couple-info" | "payment" | "delivery-info";

export const PAGE_TITLE: Record<PagePath, { title: string; subTitle: string }> =
  {
    "couple-info": {
      title: "우리의 특별한 이야기",
      subTitle: "두 사람의 소중한 정보를 정확히 입력해주세요",
    },
    payment: {
      title: "주문하기",
      subTitle: "안전하고 빠른 결제를 진행해주세요",
    },
    "delivery-info": {
      title: "전송 정보 입력",
      subTitle: "상품/청첩장을 받을 이메일 또는 주소를 정확히 입력해주세요",
    },
  };
