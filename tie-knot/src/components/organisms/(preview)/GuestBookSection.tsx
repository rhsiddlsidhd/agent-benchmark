"use client";

import { Button } from "@/components/atoms/button";
import SectionBody from "@/components/layout/SectionLayout";
import { useGuestbookModalStore } from "@/store/guestbook.modal.store";
import { PenLine, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { GuestBookSectionProps } from "./guestBookSection.mapper";

const GuestBookSection = ({ id, data }: GuestBookSectionProps) => {
  const setIsOpen = useGuestbookModalStore((state) => state.setIsOpen);
  const [isDelete, setIsDelete] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (data) {
      data.forEach((item) => {
        setIsDelete((prev) => ({ ...prev, [item._id as string]: false }));
      });
    }
  }, [data]);
  return (
    <SectionBody title="GUESTBOOK" subTitle="방명록">
      <div className="flex flex-col items-center gap-4">
        <div className="h-full text-gray-300">
          <ul className="space-y-4 py-2">
            {data && data.length === 0 && (
              <li className="py-6 text-center text-gray-400">
                등록된 방명록이 없습니다.
              </li>
            )}

            {data &&
              data.map((item) => (
                <li
                  className="relative flex items-start gap-3 rounded-md p-3 shadow-sm"
                  key={item._id as string}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{
                      opacity: !isDelete[item._id as string] ? 1 : 0,
                      y: !isDelete[item._id as string] ? 0 : -10,
                    }}
                    className="relative min-w-0 flex-1"
                  >
                    <p className="text-foreground truncate text-start text-sm font-semibold">
                      {item.author}
                    </p>
                    <p className="overflow-scroll-hidden wrap-break-words text-muted-foreground mt-1 line-clamp-3 overflow-hidden text-sm">
                      {item.message}
                    </p>
                    <motion.button
                      initial={{ opacity: 0, y: -10 }}
                      animate={{
                        opacity: !isDelete[item._id as string] ? 1 : 0,
                        y: !isDelete[item._id as string] ? 0 : -10,
                      }}
                      className="absolute top-0 right-0 cursor-pointer"
                      onClick={() =>
                        setIsOpen({
                          isOpen: true,
                          type: "DELETE_GUESTBOOK",
                          payload: item._id,
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                </li>
              ))}

            {!data && (
              <li className="py-6 text-center text-gray-400">
                방명록을 불러오는 중입니다.
              </li>
            )}
          </ul>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            setIsOpen({
              isOpen: true,
              type: "WRITE_GUESTBOOK",
              payload: { id },
            });
          }}
          className="w-full gap-2 px-8 py-6 sm:w-auto"
        >
          <PenLine className="h-5 w-5" />
          <span className="font-semibold">방명록 작성하기</span>
        </Button>
      </div>
    </SectionBody>
  );
};

export default GuestBookSection;
