export const revalidate = 3600;

import React from "react";
import { getPageAuth } from "@/server/services";

const page = async () => {
  await getPageAuth("ADMIN");

  return <div></div>;
};

export default page;
