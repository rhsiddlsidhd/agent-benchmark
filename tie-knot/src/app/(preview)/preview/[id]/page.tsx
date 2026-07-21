export const revalidate = 300;

import { getCoupleInfoById, getActiveOrderInfoByCoupleInfoId } from "@/services";

import React from "react";
import {
  AccountSection,
  Footer,
  GallerySection,
  GuestbookSection,
  HeroSection,
  InvitationMessage,
  LocationSection,
  WeddingMonthCalendar,
} from "./_components";
import {
  mapCoupleInfoToAccountProps,
  mapCoupleInfoToCalendarProps,
  mapCoupleInfoToGalleryProps,
  mapCoupleInfoToHeroProps,
  mapCoupleInfoToInvitationProps,
  mapCoupleInfoToLocationProps,
  mapCoupleInfoToThumbnails,
} from "./_utils";
import { CloudImage } from "@/components/molecules";
import { getThemeByProductId } from "@/constants";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [{ id: process.env.NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID }];
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [coupleInfoData, orderInfo] = await Promise.all([
    getCoupleInfoById(id),
    getActiveOrderInfoByCoupleInfoId(id),
  ]);

  if (!coupleInfoData) notFound();

  const { features: activeFeatures, productId } = orderInfo;
  const theme = getThemeByProductId(productId ?? undefined);
  const heroProps = mapCoupleInfoToHeroProps(coupleInfoData);
  const calendarProps = mapCoupleInfoToCalendarProps(coupleInfoData);
  const galleryProps = mapCoupleInfoToGalleryProps(
    coupleInfoData,
    activeFeatures.includes("HORIZONTAL_SLIDE"),
  );
  const locationProps = mapCoupleInfoToLocationProps(coupleInfoData);
  const thumbnailProps = mapCoupleInfoToThumbnails(coupleInfoData);
  const invitationMessageProps = mapCoupleInfoToInvitationProps(coupleInfoData);
  const accountSectionProps = mapCoupleInfoToAccountProps(coupleInfoData);

  return (
    <div className="relative" data-theme={theme}>
      {theme === "blossom" && (
        <>
          <span className="blossom-petal">🌸</span>
          <span className="blossom-petal">🌸</span>
          <span className="blossom-petal">🌸</span>
          <span className="blossom-petal">🌸</span>
          <span className="blossom-petal">🌸</span>
          <span className="blossom-petal">🌸</span>
        </>
      )}
      <HeroSection {...heroProps} />
      <InvitationMessage {...invitationMessageProps} />
      <WeddingMonthCalendar {...calendarProps} />
      <GallerySection {...galleryProps} />
      <LocationSection {...locationProps} />

      <div className="relative h-[50vh] w-full">
        <CloudImage
          src={thumbnailProps.divider}
          sizes="(max-width: 512px) 100vw, 512px"
        />
      </div>

      <GuestbookSection id={id} />
      <AccountSection {...accountSectionProps} />

      <Footer>
        <CloudImage
          src={thumbnailProps.footer}
          sizes="(max-width: 512px) 100vw, 512px"
        />
      </Footer>
    </div>
  );
};

export default Page;
