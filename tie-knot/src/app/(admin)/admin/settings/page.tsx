export const revalidate = 3600;

import React from "react";
import { verifySession } from "@/server/services";

const page = async () => {
  await verifySession("ADMIN");

  return <div></div>;
};

export default page;
