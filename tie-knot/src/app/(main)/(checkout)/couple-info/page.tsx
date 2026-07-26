export const dynamic = "force-dynamic";

import { AppError } from "@/shared/types";
import { CoupleInfoForm } from "./_components";
import { getCookie } from "@/server/lib/cookies";
import { decrypt } from "@/server/lib/jose";
import React from "react";

const page = async () => {
  const cookie = await getCookie("token");
  if (!cookie) {
    throw new AppError("UNAUTHENTICATED", "접근 권한이 없습니다. 로그인 후 이용해주세요.");
  }

  const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });

  if (!payload.id) throw new AppError("UNAUTHENTICATED", "유효하지 않은 토큰입니다.");

  return <CoupleInfoForm />;
};

export default page;
