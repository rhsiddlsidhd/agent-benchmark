"use client";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import React from "react";
import { Card } from "@/components/atoms/card";
import { ClipboardButton } from "@/components/molecules/ClipboardButton";
import { useCopy } from "@/hooks/useCopy";
import { PhoneIcon } from "lucide-react";
import {
  TypographyLarge,
  TypographyMuted,
  TypographySmall,
} from "@/components/atoms/typoqraphy";
import { Badge } from "@/components/atoms/badge";

// Contact 타입을 컴포넌트 내에서 직접 정의하여 의존성 제거
interface Contact {
  relation: string;
  name: string;
  phone: string;
}

const ViewContact = ({ payload }: { payload: Contact[] }) => {
  const { isCopied, copyToClipboard } = useCopy();

  if (!payload || payload.length === 0) {
    return (
      <div className="p-6 text-center">
        <DialogHeader>
          <DialogTitle>연락처</DialogTitle>
        </DialogHeader>
        <div className="mt-8 space-y-2">
          <TypographyMuted>혼인 당사자의 요청으로 인해</TypographyMuted>
          <TypographyMuted>연락처가 비공개 되었습니다.</TypographyMuted>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DialogHeader className="p-6">
        <DialogTitle className="text-xl">마음 전하실 곳</DialogTitle>
        <DialogDescription>
          아래 연락처를 통해 축하의 마음을 전해보세요.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-2 space-y-3 p-6 pt-0">
        {payload.map((contact) => (
          <Card key={contact.relation} className="p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Badge variant="secondary" className="w-fit font-normal text-[10px]">
                  {contact.relation}
                </Badge>
                <TypographyLarge className="font-bold">{contact.name}</TypographyLarge>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1.5 text-primary">
                    <PhoneIcon className="size-3.5" />
                    <TypographySmall className="font-mono text-sm font-semibold tracking-tight">
                      {contact.phone}
                    </TypographySmall>
                  </div>
                </div>
                <ClipboardButton
                  isCopied={isCopied}
                  onCopy={() => copyToClipboard(contact.phone)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ViewContact;
