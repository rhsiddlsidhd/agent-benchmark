import { ICoupleInfo } from "@/models";
export interface WeddingMonthCalendarProps {
  date: Date;
}

export const mapCoupleInfoToCalendarProps = (
  coupleInfo: ICoupleInfo,
): WeddingMonthCalendarProps => {
  return {
    date: coupleInfo.weddingDate,
  };
};
