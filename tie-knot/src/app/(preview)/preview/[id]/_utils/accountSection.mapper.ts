import { ICoupleInfo } from "@/server/models";
// AccountSection 컴포넌트가 받을 props 타입 정의
export interface AccountInfo {
  relation: string;
  name: string;
  bankName: string;
  accountNumber: string;
}

export interface AccountSectionMappedProps {
  groomAccounts: AccountInfo[];
  brideAccounts: AccountInfo[];
}

type CoupleSide = ICoupleInfo["groom"];
type Parent = NonNullable<CoupleSide["father"]>;

// 헬퍼 함수: 부모/신랑/신부 정보를 AccountInfo 타입으로 변환
function createAccountInfo(
  person: CoupleSide | Parent | undefined,
  relation: string,
): AccountInfo | undefined {
  // 이름, 은행명, 계좌번호가 모두 있어야 유효한 계좌 정보로 간주
  if (!person?.name || !person.bankName || !person.accountNumber) {
    return undefined;
  }
  return {
    relation,
    name: person.name,
    bankName: person.bankName,
    accountNumber: person.accountNumber,
  };
}

/**
 * coupleInfoData를 받아 AccountSection 컴포넌트의 props를 생성하는 매퍼 함수
 * @param coupleInfoData - getCoupleInfoById로 가져온 원시 데이터
 * @returns AccountSection 컴포넌트가 필요로 하는 `groomAccounts` 및 `brideAccounts` 배열을 포함한 객체
 */
export function mapCoupleInfoToAccountProps(
  coupleInfoData: ICoupleInfo,
): AccountSectionMappedProps {
  // 1. 신랑측 계좌 정보 배열 생성
  const groomAccounts = [
    createAccountInfo(coupleInfoData.groom, "신랑"),
    createAccountInfo(coupleInfoData.groom.father, "신랑 아버지"),
    createAccountInfo(coupleInfoData.groom.mother, "신랑 어머니"),
  ].filter((account): account is AccountInfo => !!account);

  // 2. 신부측 계좌 정보 배열 생성
  const brideAccounts = [
    createAccountInfo(coupleInfoData.bride, "신부"),
    createAccountInfo(coupleInfoData.bride.father, "신부 아버지"),
    createAccountInfo(coupleInfoData.bride.mother, "신부 어머니"),
  ].filter((account): account is AccountInfo => !!account);

  return { groomAccounts, brideAccounts };
}
