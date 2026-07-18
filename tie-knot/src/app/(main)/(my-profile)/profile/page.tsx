export const dynamic = "force-dynamic";

import BasicInfoForm from "@/components/organisms/BasicInfoForm";
import ChangePasswordForm from "@/components/organisms/ChangePasswordForm";
import { getCookie } from "@/lib/cookies/get";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";
import { decrypt } from "@/lib/token";
import { getUser } from "@/services/auth.service";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
  const cookie = await getCookie("token");
  if (!cookie) return redirect("/login");
  const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });
  const user = await getUser({ id: payload.id });
  if (!user) redirect("/login");
  const { email, name, phone } = user;

  return (
    <div className="space-y-6">
      <div>
        <TypographyH1 className="text-left mb-2 text-3xl font-bold">프로필 관리</TypographyH1>
        <TypographyMuted>
          회원 정보를 수정하고 관리합니다.
        </TypographyMuted>
      </div>
      <BasicInfoForm email={email} name={name} phone={phone} />
      <ChangePasswordForm />
    </div>
  );
};

export default page;
