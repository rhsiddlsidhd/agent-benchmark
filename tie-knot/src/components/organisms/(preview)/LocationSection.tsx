"use client";

import { ClipboardButton } from "@/components/molecules/ClipboardButton";
import { useCopy } from "@/hooks/useCopy";
import SectionBody from "@/components/layout/SectionLayout";
import KakaoMap from "@/components/molecules/KakaoMap";
import Navigation from "@/components/organisms/(preview)/Navigation";
import { LocationSectionProps } from "./locationSection.mapper";

export function LocationSection({
  venueName,
  address,
  addressDetail,
}: LocationSectionProps) {
  const fullAddress = addressDetail ? `${address} ${addressDetail}` : address;
  const { isCopied, copyToClipboard } = useCopy();

  return (
    <SectionBody title="LOCATION" subTitle="오시는 길">
      <div>
        <p className="text-foreground text-md font-semibold">{venueName}</p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-muted-foreground text-sm">{fullAddress}</p>
          {/* 재사용 가능한 ClipboardButton으로 교체 */}
          <ClipboardButton
            isCopied={isCopied}
            onCopy={() => copyToClipboard(fullAddress)}
          />
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-muted relative mb-6 aspect-video overflow-hidden rounded-xl">
        <KakaoMap address={address} />
      </div>

      {/* Navigation Buttons */}
      <Navigation address={fullAddress} />

      {/* Transportation Info */}
    </SectionBody>
  );
}
