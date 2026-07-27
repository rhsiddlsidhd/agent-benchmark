export const dynamic = "force-dynamic";

import { AppError } from "@/shared/types";
import { CoupleInfoForm } from "./_components";
import { verifySession } from "@/server/services";
import React from "react";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) => {
  const { q } = await searchParams;

  if (!q) {
    throw new AppError("VALIDATION", "잘못된 접근입니다.");
  }

  await verifySession();

  return <CoupleInfoForm />;
};

export default Page;
