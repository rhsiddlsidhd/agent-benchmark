export const dynamic = "force-dynamic";

import { CheckCircle2, AlertCircle, Home, FileText } from "lucide-react";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { TypographyH1, TypographyMuted, TypographySmall } from "@/components/atoms/typoqraphy";

import Link from "next/link";
import { redirect } from "next/navigation";
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) return redirect("/");

  return (
    <div className="container mx-auto min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Success Icon */}
        <div className="mb-8 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <CheckCircle2 className="text-primary h-12 w-12" />
          </div>
          <TypographyH1 className="mb-2 text-3xl font-bold">결제가 완료되었습니다!</TypographyH1>
          <TypographyMuted>
            주문이 정상적으로 처리되었습니다.
          </TypographyMuted>
        </div>

        {/* Order Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>주문 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-muted-foreground">주문번호</span>
              <span className="font-mono text-sm font-medium">{orderId}</span>
            </div>

            <div className="bg-primary/5 rounded-lg p-4">
              <div className="mb-2 flex items-start gap-2">
                <AlertCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <TypographySmall className="mb-1 font-medium">주문 처리 안내</TypographySmall>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• 결제 완료 후 영업일 기준 1-2일 이내에 처리됩니다.</li>
                    <li>• 주문 내역은 마이페이지에서 확인하실 수 있습니다.</li>
                    <li>• 문의사항은 고객센터로 연락 주시기 바랍니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 이동
            </Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link href="/my-orders">
              <FileText className="mr-2 h-4 w-4" />
              주문 내역 확인
            </Link>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <TypographyMuted>
            결제 관련 문의사항이 있으시면{" "}
            <a href="/support" className="text-primary hover:underline">
              고객센터
            </a>
            로 문의해 주세요.
          </TypographyMuted>
        </div>
      </div>
    </div>
  );
}
