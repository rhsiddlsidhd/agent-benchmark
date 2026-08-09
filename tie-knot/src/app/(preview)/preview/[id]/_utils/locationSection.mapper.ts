import { ICoupleInfo } from "@/server/models";
export interface LocationSectionProps {
  venueName: string;
  address: string;
  addressDetail?: string;
  subwayStation?: string;
}

export const mapCoupleInfoToLocationProps = (
  coupleInfo: ICoupleInfo,
): LocationSectionProps => {
  return {
    venueName: coupleInfo.venue,
    address: coupleInfo.address,
    addressDetail: coupleInfo.addressDetail,
    subwayStation: coupleInfo.subwayStation,
  };
};
