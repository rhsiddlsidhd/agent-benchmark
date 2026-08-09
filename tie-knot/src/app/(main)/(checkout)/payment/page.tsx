export const dynamic = "force-dynamic";

import { CheckoutForm } from "./_components";
import { verifySession } from "@/server/services";
import React from "react";

const page = async () => {
  await verifySession();

  return <CheckoutForm />;
};

export default page;
