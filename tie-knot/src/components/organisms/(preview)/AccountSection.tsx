"use client";

import SectionBody from "@/components/layout/SectionLayout";
import React, { useMemo, useState } from "react";
import { Card } from "@/components/atoms/card";
import { ClipboardButton } from "@/components/molecules/ClipboardButton";
import { useCopy } from "@/hooks/useCopy";

import { cn } from "@/lib/utils";
import { useBanks } from "@/hooks/useBanks";
import { Tabs, TabsList, TabsTrigger } from "@/components/atoms/tabs";
import {
  AccountInfo,
  AccountSectionMappedProps,
} from "./accountSection.mapper";
import {
  TypographyLarge,
  TypographyMuted,
} from "@/components/atoms/typoqraphy";
import { Badge } from "@/components/atoms/badge";

const AccountSection = ({
  groomAccounts,
  brideAccounts,
}: AccountSectionMappedProps) => {
  const [selectedSide, setSelectedSide] = useState<"groom" | "bride">("groom");
  const { banks } = useBanks();
  const { isCopied, copyToClipboard } = useCopy();

  const bankNameMap = useMemo(() => {
    if (!banks) return {};
    return banks.reduce(
      (map, bank) => {
        map[bank.bank] = bank.name.ko;
        return map;
      },
      {} as Record<string, string>,
    );
  }, [banks]);

  const renderAccountCards = (accounts: AccountInfo[]) => {
    if (accounts.length === 0) {
      return (
        <TypographyMuted className="text-center">
          등록된 계좌 정보가 없습니다.
        </TypographyMuted>
      );
    }

    return accounts.map((account) => (
      <Card
        key={account.relation}
        className="p-5 shadow-sm transition-all hover:shadow-md"
        role="article"
        aria-label={`${account.relation} ${account.name}의 계좌 정보`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal opacity-80">
                {account.relation}
              </Badge>
              <TypographyLarge className="font-bold">{account.name}</TypographyLarge>
            </div>
            <TypographyMuted className="text-sm">
              {bankNameMap[account.bankName] || account.bankName}
            </TypographyMuted>
          </div>
          <div className="flex items-center gap-2">
            <TypographyLarge className="font-mono text-base tracking-tighter">
              {account.accountNumber}
            </TypographyLarge>
            <ClipboardButton
              isCopied={isCopied}
              onCopy={() => copyToClipboard(account.accountNumber)}
            />
          </div>
        </div>
      </Card>
    ));
  };

  return (
    <SectionBody title="ACCOUNT" subTitle="마음 전하실 곳">
      {/* Toggle UI */}
      <div className="mb-6 flex justify-center">
        <Tabs
          defaultValue="groom"
          onValueChange={(value) => setSelectedSide(value as "groom" | "bride")}
          className="w-50"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groom">신랑측</TabsTrigger>
            <TabsTrigger value="bride">신부측</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Opacity-based transition container */}
      <div className="grid">
        {/* Groom's List */}
        <div
          className={cn(
            "space-y-3 transition-opacity duration-300 [grid-area:1/1]",
            selectedSide === "groom"
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          {renderAccountCards(groomAccounts)}
        </div>

        {/* Bride's List */}
        <div
          className={cn(
            "space-y-3 transition-opacity duration-300 [grid-area:1/1]",
            selectedSide === "bride"
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          {renderAccountCards(brideAccounts)}
        </div>
      </div>
    </SectionBody>
  );
};

export default AccountSection;
