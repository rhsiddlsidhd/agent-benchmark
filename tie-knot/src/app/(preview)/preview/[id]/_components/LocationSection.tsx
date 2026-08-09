"use client";

import { ClipboardButton, KakaoMap } from "@/client/components/molecules";
import { useCopy, useNavigationGeo, useSubwayLineInfo } from "@/client/hooks";
import { EyebrowSection } from "./EyebrowSection";

import { Navigation } from "./Navigation";
import { LocationSectionProps } from "../_utils/locationSection.mapper";

export function LocationSection({
  venueName,
  address,
  addressDetail,
  subwayStation,
}: LocationSectionProps) {
  const fullAddress = addressDetail ? `${address} ${addressDetail}` : address;
  const { isCopied, copyToClipboard } = useCopy();
  const geoState = useNavigationGeo(fullAddress);
  const { lineInfo } = useSubwayLineInfo(subwayStation);

  return (
    <EyebrowSection eyebrow="LOCATION" heading="오시는 길">
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
      <Navigation address={fullAddress} geoState={geoState} />

      {/* Transportation Info */}
      {lineInfo && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">{lineInfo.station}역</span>
          <div className="flex gap-1.5">
            {lineInfo.lines.map((line) => (
              <span
                key={line.name}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: line.color }}
              >
                {line.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </EyebrowSection>
  );
}
