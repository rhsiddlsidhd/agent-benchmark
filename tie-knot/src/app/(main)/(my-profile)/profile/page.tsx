export const dynamic = "force-dynamic";

import { BasicInfoForm, ChangePasswordForm } from "@/client/components/organisms";

import { TypographyH1, TypographyMuted } from "@/client/components/atoms";
import { verifySession, getUser } from "@/server/services";
import { redirect } from "next/navigation";
import React from "react";
import { routes } from "@/shared/constants";

const page = async () => {
  const session = await verifySession();
  const user = await getUser({ id: session.userId });
  if (!user) return redirect(routes.login);
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
