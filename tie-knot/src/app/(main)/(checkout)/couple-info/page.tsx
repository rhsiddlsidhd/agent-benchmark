export const dynamic = "force-dynamic";

import { HTTPError } from "@/types/error";
import { CoupleInfoForm } from "@/components/organisms/CoupleInfoForm";
import { getCookie } from "@/lib/cookies/get";
import { decrypt } from "@/lib/token";
import React from "react";

const page = async () => {
  const cookie = await getCookie("token");
  if (!cookie) {
    throw new HTTPError("접근 권한이 없습니다. 로그인 후 이용해주세요.", 401);
  }

  const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });

  if (!payload.id) throw new HTTPError("유효하지 않은 토큰입니다.", 401);

  return <CoupleInfoForm type={"create"} />;
};

export default page;
