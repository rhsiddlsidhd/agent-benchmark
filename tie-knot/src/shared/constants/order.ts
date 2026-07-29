// 결제완료 후 couple-info(청첩장 콘텐츠)를 이 기간(일) 안에 입력하지 않으면
// 자동취소+환불 대상이 된다(TODO.md "couple-info를 payment 이후로 분리" 참고).
export const COUPLE_INFO_DEADLINE_DAYS = 7;
