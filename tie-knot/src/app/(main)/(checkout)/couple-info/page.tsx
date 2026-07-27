export const dynamic = "force-dynamic";

import { CoupleInfoForm } from "./_components";
import { verifySession } from "@/server/services";
import React from "react";

const page = async () => {
  await verifySession();

  return <CoupleInfoForm />;
};

export default page;
