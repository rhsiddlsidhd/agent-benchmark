import { IGuestbook } from "@/server/models";
export interface GuestbookEntryProps {
  id: string;
  author: string;
  message: string;
}

export interface GuestbookSectionProps {
  id: string;
  data: GuestbookEntryProps[];
}

export const mapDataToGuestbookProps = (
  id: string,
  data: IGuestbook[],
): GuestbookSectionProps => {
  return {
    id,
    data: data.map((item) => ({
      id: item._id as string,
      author: item.author,
      message: item.message,
    })),
  };
};
