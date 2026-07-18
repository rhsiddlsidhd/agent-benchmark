"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import CloudImage from "@/components/molecules/CloudImage";
import { Button } from "@/components/atoms/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/atoms/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import SectionBody from "@/components/layout/SectionLayout";
import { GallerySectionProps } from "./gallerySection.mapper";

export function GallerySection({
  images,
  lightboxEnabled,
}: GallerySectionProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    if (!lightboxEnabled) return;
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) return null;

  return (
    <SectionBody title="GALLERY" subTitle="웨딩 갤러리">
      <div className="grid grid-cols-2 gap-2">
        {images.map((src, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg transition-opacity hover:opacity-90"
          >
            <CloudImage
              src={src}
              alt={`Gallery image ${index + 1}`}
              sizes="(max-width: 512px) 50vw, 320px"
            />
          </button>
        ))}
      </div>

      {lightboxEnabled && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="w-full max-w-[95vw] border-none bg-black p-0">
            <VisuallyHidden>
              <DialogTitle>갤러리 이미지 보기</DialogTitle>
            </VisuallyHidden>
            <div className="relative h-[70vh]">
              <CloudImage
                src={images[currentIndex] || ""}
                alt={`Gallery image ${currentIndex + 1}`}
                sizes="(max-width)100vw , 512px"
                className="object-contain"
              />

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={prev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={next}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </SectionBody>
  );
}
