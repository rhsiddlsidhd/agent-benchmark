"use client";
import { PAGE_TITLE } from "@/shared/constants";
import { isPageTitle } from "@/shared/utils";
import { usePathname } from "next/navigation";
import React from "react";
import { TypographyH1, TypographyMuted } from "@/client/components/atoms";
const PageTitle = () => {
  const pathname = usePathname();
  const key = pathname.replace("/", "");

  return (
    <div className="mb-8">
      <TypographyH1 className="text-left mb-2 text-3xl font-bold md:text-4xl">
        {/* 결제하기 */}
        {/* {PAGET_TITLE[isPageTitle[]]} */}
        {isPageTitle(key) && PAGE_TITLE[key].title}
      </TypographyH1>
      <TypographyMuted>
        {/* 안전하고 빠른 결제를 진행해주세요 */}
        {isPageTitle(key) && PAGE_TITLE[key].subTitle}
      </TypographyMuted>
    </div>
  );
};

export { PageTitle };
