export const dynamic = "force-dynamic";

import { CheckoutForm } from "@/components/organisms/CheckoutForm";

import React from "react";

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) => {
  const { q } = await searchParams;

  if (!q) throw new Error("잘못된 접근 입니다.");
  return <CheckoutForm query={q} />;
};

export default page;
