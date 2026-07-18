import { ICoupleInfo } from "@/models/coupleInfo.model";

export interface LocationSectionProps {
  venueName: string;
  address: string;
  addressDetail?: string;
}

export const mapCoupleInfoToLocationProps = (
  coupleInfo: ICoupleInfo,
): LocationSectionProps => {
  return {
    venueName: coupleInfo.venue,
    address: coupleInfo.address,
    addressDetail: coupleInfo.addressDetail,
  };
};
