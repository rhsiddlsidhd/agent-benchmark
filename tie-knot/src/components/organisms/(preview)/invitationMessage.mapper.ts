// 최종적으로 InvitationMessage 컴포넌트가 받을 props 타입
interface Contact {
  relation: string;
  name: string;
  phone: string;
}

interface Party {
  parentNames: string;
  name: string;
  title: string;
  contacts: Contact[];
}

export interface InvitationMessageMappedProps {
  parties: Party[];
}

interface PersonData {
  name: string;
  phone: string;
}

interface CoupleData {
  name: string;
  phone: string;
  father?: PersonData;
  mother?: PersonData;
}

interface CoupleInfoData {
  groom: CoupleData;
  bride: CoupleData;
}

// 헬퍼 함수 1: PersonData를 Contact 타입으로 변환
function createContact(
  person: PersonData | undefined,
  relation: string,
): Contact | undefined {
  if (!person?.name || !person.phone) {
    return undefined;
  }
  return {
    relation,
    name: person.name,
    phone: person.phone,
  };
}

// 헬퍼 함수 2: 부모님 이름 문자열 생성
function getParentNamesString(parents: {
  father?: PersonData;
  mother?: PersonData;
}): string {
  const parts = [];
  if (parents.father?.name) {
    parts.push(`아버지 ${parents.father.name}`);
  }
  if (parents.mother?.name) {
    parts.push(`어머니 ${parents.mother.name}`);
  }
  return parts.join(" · ");
}

/**
 * coupleInfoData를 받아 InvitationMessage 컴포넌트의 props를 생성하는 매퍼 함수
 * @param coupleInfoData - getCoupleInfoById로 가져온 원시 데이터
 * @returns InvitationMessage 컴포넌트가 필요로 하는 `parties` 배열을 포함한 객체
 */
export function mapCoupleInfoToInvitationProps(
  coupleInfoData: CoupleInfoData,
): InvitationMessageMappedProps {
  // 1. 신랑측 연락처 배열 생성
  const groomSideContacts = [
    createContact(coupleInfoData.groom, "신랑"),
    createContact(coupleInfoData.groom.father, "신랑 아버지"),
    createContact(coupleInfoData.groom.mother, "신랑 어머니"),
  ].filter((contact): contact is Contact => !!contact);

  // 2. 신부측 연락처 배열 생성
  const brideSideContacts = [
    createContact(coupleInfoData.bride, "신부"),
    createContact(coupleInfoData.bride.father, "신부 아버지"),
    createContact(coupleInfoData.bride.mother, "신부 어머니"),
  ].filter((contact): contact is Contact => !!contact);

  // 3. UI 표시에 필요한 최종 데이터 배열 조립
  const displayParties: Party[] = [
    {
      parentNames: getParentNamesString(coupleInfoData.groom),
      name: coupleInfoData.groom.name,
      title: "신랑",
      contacts: groomSideContacts,
    },
    {
      parentNames: getParentNamesString(coupleInfoData.bride),
      name: coupleInfoData.bride.name,
      title: "신부",
      contacts: brideSideContacts,
    },
  ];

  return { parties: displayParties };
}
