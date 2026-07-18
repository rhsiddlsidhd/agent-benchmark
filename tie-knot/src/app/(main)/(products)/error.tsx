"use client";

import { Button } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="space-y-6 p-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>

            <div className="space-y-2">
              <TypographyH1 className="text-left text-3xl font-bold">
                상품 페이지 오류
              </TypographyH1>
              <TypographyMuted>
                요청을 처리하는 중 문제가 발생했습니다.
              </TypographyMuted>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-600">
                Development Error Details:
              </p>
              <div className="rounded-md bg-red-50 p-4">
                <p className="font-mono text-xs break-all whitespace-pre-wrap text-red-800">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-red-600">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={reset} variant="default" size="lg">
              다시 시도
            </Button>
            <Button onClick={() => router.push("/")} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
