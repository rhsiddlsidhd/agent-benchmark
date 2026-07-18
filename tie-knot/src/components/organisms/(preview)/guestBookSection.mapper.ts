import { IGuestbook } from "@/models/guestbook.model";

export interface GuestBookSectionProps {
  id: string;
  data: IGuestbook[];
}

export const mapDataToGuestbookProps = (
  id: string,
  data: IGuestbook[],
): GuestBookSectionProps => {
  return {
    id,
    data,
  };
};
