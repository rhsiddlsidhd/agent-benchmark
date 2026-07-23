export const dynamic = "force-dynamic";

import { HTTPError } from "@/shared/types";
import { CoupleInfoForm } from "./_components";
import { getCookie } from "@/server/lib/cookies";
import { decrypt } from "@/server/lib/jose";
import { redirect } from "next/navigation";
import React from "react";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) => {
  const { q } = await searchParams;

  if (!q) {
    throw new HTTPError("잘못된 접근입니다.", 400);
  }

  const cookie = await getCookie("token");
  if (!cookie) return redirect("/login");

  const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });
  if (!payload.id) return redirect("/login");

  return <CoupleInfoForm />;
};

export default Page;
