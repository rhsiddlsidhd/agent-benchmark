"use client";

import useSWR from "swr";
import { fetcher } from "@/api/fetcher";
import GuestBookSection from "./GuestBookSection";
import { IGuestbook } from "@/models/guestbook.model";

export function GuestBookClientSection({ id }: { id: string }) {
  const { data } = useSWR<IGuestbook[]>(
    `/api/guestbook?id=${id}`,
    (url) => fetcher<IGuestbook[]>(url),
    { revalidateOnFocus: false },
  );

  return <GuestBookSection id={id} data={data ?? []} />;
}
