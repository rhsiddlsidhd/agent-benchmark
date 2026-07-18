import { ICoupleInfo } from "@/models/coupleInfo.model";

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
