"use client";

import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Share2, LinkIcon, MessageCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ShareSectionProps {
  invitationId: string;
}

export function ShareSection({ invitationId }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);
  const invitationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invitation/${invitationId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareKakao = () => {
    // Kakao SDK integration would go here
    alert("카카오톡 공유 기능은 SDK 연동 후 사용 가능합니다.");
  };

  const shareSMS = () => {
    const message = `청첩장을 보내드립니다.\n${invitationUrl}`;
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  return (
    <section className="bg-muted/30 px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <Share2 className="text-primary mx-auto mb-4 h-8 w-8" />
          <h2 className="text-foreground mb-3 font-serif text-3xl">
            청첩장 공유하기
          </h2>
          <p className="text-muted-foreground text-sm">
            소중한 분들께 청첩장을 공유해보세요
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={shareKakao}
                className="h-20 flex-col gap-2 bg-transparent"
              >
                <MessageCircle className="h-6 w-6 text-yellow-500" />
                <span className="text-xs">카카오톡</span>
              </Button>
              <Button
                variant="outline"
                onClick={shareSMS}
                className="h-20 flex-col gap-2 bg-transparent"
              >
                <MessageCircle className="h-6 w-6 text-green-500" />
                <span className="text-xs">문자</span>
              </Button>
              <Button
                variant="outline"
                onClick={copyUrl}
                className="h-20 flex-col gap-2 bg-transparent"
              >
                {copied ? (
                  <>
                    <CheckCircle className="text-primary h-6 w-6" />
                    <span className="text-xs">복사됨</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-6 w-6" />
                    <span className="text-xs">URL 복사</span>
                  </>
                )}
              </Button>
            </div>

            <div className="border-border border-t pt-4">
              <p className="text-muted-foreground mb-2 text-xs">청첩장 URL</p>
              <div className="flex gap-2">
                <Input value={invitationUrl} readOnly className="text-xs" />
                <Button variant="outline" size="sm" onClick={copyUrl}>
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
