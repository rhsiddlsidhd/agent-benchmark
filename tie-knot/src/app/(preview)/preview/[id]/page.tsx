export const revalidate = 300;

import { mapCoupleInfoToHeroProps } from "@/components/organisms/(preview)/heroSection.mapper";
import { InvitationMessage } from "@/components/organisms/(preview)/InvitationMessage";
import { GallerySection } from "@/components/organisms/(preview)/GallerySection";
import { LocationSection } from "@/components/organisms/(preview)/LocationSection";
import { Footer } from "@/components/organisms/(preview)/Footer";
import { getCoupleInfoById } from "@/services/coupleInfo.service";
import { mapCoupleInfoToAccountProps } from "@/components/organisms/(preview)/accountSection.mapper";
import { getActiveOrderInfoByCoupleInfoId } from "@/services/order.service";
import React from "react";
import WeddingMonthCalendar from "@/components/organisms/(preview)/WeddingMonthCalendar";
import { GuestBookClientSection } from "@/components/organisms/(preview)/GuestBookClientSection";
import AccountSection from "@/components/organisms/(preview)/AccountSection";
import CloudImage from "@/components/molecules/CloudImage";
import { mapCoupleInfoToCalendarProps } from "@/components/organisms/(preview)/weddingMonthCalendar.mapper";
import { mapCoupleInfoToGalleryProps } from "@/components/organisms/(preview)/gallerySection.mapper";
import { mapCoupleInfoToLocationProps } from "@/components/organisms/(preview)/locationSection.mapper";
import { mapCoupleInfoToThumbnails } from "@/components/organisms/(preview)/thumbnails.mapper";
import { HeroSection } from "@/components/organisms/(preview)/HeroSection";
import { mapCoupleInfoToInvitationProps } from "@/components/organisms/(preview)/invitationMessage.mapper";
import { getThemeByProductId } from "@/constants/theme";
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

      <GuestBookClientSection id={id} />
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
