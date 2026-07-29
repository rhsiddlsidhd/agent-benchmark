export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { routes } from "@/shared/constants";
import { PaymentSuccessTemplate } from "./_components";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) return redirect(routes.home);

  return <PaymentSuccessTemplate orderId={orderId} />;
}
