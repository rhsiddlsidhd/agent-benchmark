import { Calendar, MapPin } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";

import { HeroSectionProps } from "./heroSection.mapper";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";
import CloudImage from "@/components/molecules/CloudImage";

export function HeroSection({
  groomName,
  brideName,
  weddingDate,
  venueName,
  address,
  addressDetail,
  thumbnailImage,
}: HeroSectionProps) {
  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <CloudImage
          src={thumbnailImage}
          alt="inivitation main Thumbnail"
          sizes="(max-width: 768px) 100vw, 512px"
          priority={true}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 text-center text-white">
        <div className="mb-12">
          <TypographyMuted className="mb-4 text-xs font-light tracking-[0.4em] text-white/80 uppercase">
            Wedding Invitation
          </TypographyMuted>
          <TypographyH1 className="mb-6 font-serif text-5xl leading-tight text-white md:text-7xl">
            {groomName}{" "}
            <span className="mx-2 font-sans text-2xl font-light opacity-70 md:text-4xl">
              &
            </span>{" "}
            {brideName}
          </TypographyH1>
        </div>

        <div className="space-y-5 text-lg font-light tracking-wide">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4 opacity-80" />
            <span>
              {formatInTimeZone(weddingDate, "Asia/Seoul", "yyyy. MM. dd EEEE a h시", { locale: ko })}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-sm opacity-80">
              <span>{address}</span>
              {addressDetail && <span className="ml-1.5">{addressDetail}</span>}
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4 opacity-80" />
              <span className="font-medium">{venueName}</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex h-12 w-7 items-start justify-center rounded-full border border-white/30 p-2">
            <div className="h-2 w-1 rounded-full bg-white/60" />
          </div>
        </div>
      </div>
    </section>
  );
}
