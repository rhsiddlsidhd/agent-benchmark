export const dynamic = "force-dynamic";

import { AppError } from "@/shared/types";
import { CoupleInfoForm } from "./_components";
import { verifySession } from "@/server/services";
import React from "react";

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) => {
  const { orderId } = await searchParams;

  if (!orderId) {
    throw new AppError("VALIDATION", "잘못된 접근입니다.");
  }

  await verifySession();

  return <CoupleInfoForm />;
};

export default page;
