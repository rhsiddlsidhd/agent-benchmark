import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/atoms/carousel";
import React from "react";
import { ProductCard } from "./ProductCard";
import { TypographyH2, TypographyP } from "@/components/atoms/typoqraphy";
import { ProductJSON } from "@/models/product.model";

interface TemplateCarouselGroupProps {
  data: ProductJSON[];
  title: string;
  description: string;
}

/**
 * 특정 카테고리의 템플릿들을 가로 캐러셀 형태로 보여주는 그룹 (Organism)
 */
export const TemplateCarouselGroup = async ({
  data,
  title,
  description,
}: TemplateCarouselGroupProps) => {
  if (data.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <TypographyH2 className="border-none text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </TypographyH2>
        <TypographyP className="text-slate-500">{description}</TypographyP>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <div className="relative">
          <CarouselContent className="-ml-4">
            {data.map((product) => (
              <CarouselItem
                key={product._id}
                className="pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </div>
        </div>
      </Carousel>
    </div>
  );
};
