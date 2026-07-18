export const dynamic = "force-dynamic";

import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { TypographyH1, TypographyH3, TypographyMuted } from "@/components/atoms/typoqraphy";
import ProductThumbnail from "@/components/molecules/ProductThumbnail";
import { getCookie } from "@/lib/cookies/get";
import { decrypt } from "@/lib/token";
import { getOrdersByUserId } from "@/services/order.service";
import {
  Edit,
  RefreshCw,
  Star,
  EllipsisVertical,
  Inbox,
  CreditCard,
} from "lucide-react";
import { redirect } from "next/navigation";
import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import { IOrder } from "@/models/order.model";
import { PayMethod } from "@/models/payment";
import PaymentButton from "@/components/molecules/PaymentButton";

type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const PAYMENT_STATUS: Record<OrderStatus, string> = {
  PENDING: "주문대기",
  CONFIRMED: "결제완료",
  COMPLETED: "제작완료",
  CANCELLED: "취소",
};

const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  CARD: "신용카드",
  TRANSFER: "실시간 계좌이체",
  VIRTUAL_ACCOUNT: "가상계좌",
  MOBILE: "휴대폰 소액결제",
};

const groupOrdersByDate = (orders: IOrder[]) => {
  const grouped: Record<string, IOrder[]> = {};

  orders.forEach((order) => {
    const dateKey = format(new Date(order.createdAt), "yyyy-MM-dd");
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(order);
  });

  return Object.entries(grouped).sort(([dateA], [dateB]) =>
    dateB.localeCompare(dateA),
  );
};

const Page = async () => {
  const cookie = await getCookie("token");
  if (!cookie) return redirect("/login");
  const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });

  if (!payload.id) return redirect("/login");
  const orders = await getOrdersByUserId(payload.id);

  const groupedOrders = groupOrdersByDate(orders);

  return (
    <div className="space-y-6">
      <div>
        <TypographyH1 className="text-left mb-2 text-3xl font-bold">주문 목록</TypographyH1>
        <TypographyMuted>
          구매한 템플릿과 주문 상태를 확인합니다.
        </TypographyMuted>
      </div>

      <div className="space-y-4">
        {groupedOrders.length > 0 ? (
          groupedOrders.map(([date, dateOrders]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(new Date(date), "yyyy년 MM월 dd일")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dateOrders.map((order) => {
                  const product = order.product;
                  const hasDiscount =
                    order.discountRate > 0 || order.discountAmount > 0;

                  return (
                    <div
                      key={order._id.toString()}
                      className="border-border flex items-start justify-between gap-6 rounded-lg border p-4"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <div className="flex justify-between text-2xl font-bold">
                          <div className="flex items-center gap-4">
                            <p>{PAYMENT_STATUS[order.orderStatus]}</p>
                            <TypographyMuted>
                              {order.merchantUid}
                            </TypographyMuted>
                          </div>
                          <Button size="sm" variant="ghost">
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                            <ProductThumbnail
                              src={product.thumbnail ?? "#"}
                              alt={product.title}
                              sizes="128px"
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <TypographyH3 className="text-foreground text-base font-semibold">
                                {product.title}
                              </TypographyH3>
                            </div>
                            <div className="pt-2">
                              {hasDiscount && (
                                <div className="mb-1 text-xs text-red-500">
                                  {order.discountRate > 0 &&
                                    `${Math.round(order.discountRate * 100)}% 할인`}
                                  {order.discountAmount > 0 &&
                                    ` -${order.discountAmount.toLocaleString()}원`}
                                </div>
                              )}
                              <TypographyMuted>
                                {order.finalPrice.toLocaleString()}원{" "}
                                {product.quantity}개
                              </TypographyMuted>
                              <TypographyMuted className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {PAY_METHOD_LABEL[order.payMethod]}
                              </TypographyMuted>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        {order.orderStatus === "PENDING" && (
                          <PaymentButton order={order} />
                        )}
                        {order.orderStatus !== "CANCELLED" && (
                          <Button size="lg" variant="outline" asChild>
                            <Link
                              href={`/order/edit?q=${order.coupleInfoId.toString()}`}
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              수정하기
                            </Link>
                          </Button>
                        )}
                        {order.orderStatus === "CONFIRMED" && (
                          <Button size="lg" variant="outline">
                            <RefreshCw className="mr-1 h-4 w-4" />
                            환불신청
                          </Button>
                        )}
                        {order.orderStatus === "COMPLETED" && (
                          <Button size="lg" variant="default">
                            <Star className="mr-1 h-4 w-4" />
                            리뷰
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Inbox className="h-8 w-8 text-gray-500" />
            </div>
            <TypographyH3 className="mt-4 text-xl font-semibold">
              주문 내역이 없습니다.
            </TypographyH3>
            <TypographyMuted className="mt-2 text-gray-500">
              아직 주문한 상품이 없어요. 상품을 구경하고 첫 주문을 해보세요.
            </TypographyMuted>
            <Button asChild className="mt-6">
              <Link href="/products?category=invitation">청첩장 보러가기</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
