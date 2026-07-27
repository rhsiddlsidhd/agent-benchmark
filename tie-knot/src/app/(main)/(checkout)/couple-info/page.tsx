export const dynamic = "force-dynamic";

import { CoupleInfoForm } from "./_components";
import { getPageAuth } from "@/server/services";
import React from "react";

const page = async () => {
  await getPageAuth();

  return <CoupleInfoForm />;
};

export default page;
