"use client";

import { Button } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  backPath?: string;
  backLabel?: string;
}

export default function ErrorFallback({
  error,
  reset,
  title = "오류가 발생했습니다",
  description = "요청을 처리하는 중 문제가 발생했습니다.",
  backPath = "/",
  backLabel = "홈으로 돌아가기",
}: ErrorFallbackProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg border-red-100 shadow-lg">
        <div className="space-y-6 p-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>

            <div className="space-y-2">
              <TypographyH1 className="text-foreground text-3xl font-bold">{title}</TypographyH1>
              <TypographyMuted className="text-sm">{description}</TypographyMuted>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-600">
                Development Error Details:
              </p>
              <div className="rounded-md bg-red-50 p-4">
                <p className="font-mono text-xs break-all whitespace-pre-wrap text-red-800">
                  {error.message || "No error message provided"}
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
            <Button
              onClick={reset}
              variant="default"
              size="lg"
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
            <Button
              onClick={() => router.push(backPath)}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
