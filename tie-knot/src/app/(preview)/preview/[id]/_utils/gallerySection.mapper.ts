import { ICoupleInfo } from "@/server/models";
export interface GallerySectionProps {
  images: string[];
  lightboxEnabled: boolean;
}

export const mapCoupleInfoToGalleryProps = (
  coupleInfo: ICoupleInfo,
  lightboxEnabled: boolean,
): GallerySectionProps => ({
  images: coupleInfo.galleryImages,
  lightboxEnabled,
});
