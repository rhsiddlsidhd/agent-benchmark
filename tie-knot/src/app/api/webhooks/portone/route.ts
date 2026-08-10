import { Webhook } from "@portone/server-sdk";
import { syncPayment } from "@/server/services/payment.service";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  const expectedStoreId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  if (!secret || !expectedStoreId) {
    return Response.json({ error: "PortOne webhook is not configured" }, { status: 503 });
  }

  const payload = await request.text();
  let webhook: Awaited<ReturnType<typeof Webhook.verify>>;
  try {
    webhook = await Webhook.verify(secret, payload, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    });
  } catch {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (Webhook.isUnrecognizedWebhook(webhook)) {
    return Response.json({ received: true, ignored: true }, { status: 202 });
  }
  if (!("data" in webhook) || !("storeId" in webhook.data) || webhook.data.storeId !== expectedStoreId) {
    return Response.json({ error: "Unexpected PortOne store" }, { status: 400 });
  }

  if ("paymentId" in webhook.data) {
    await syncPayment(webhook.data.paymentId);
  }

  return Response.json({ received: true });
}
