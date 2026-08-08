"use client";

import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import {
  TypographyH2,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/client/components/atoms";
import { PRODUCT_CATEGORIES, SUB_CATEGORY_MAP, type ProductCategory } from "@/shared/constants";
import { SubCategoryNavItem } from "./SubCategoryNavItem";

const categorizedSubCategories = PRODUCT_CATEGORIES.flatMap((category: ProductCategory) =>
  SUB_CATEGORY_MAP[category].map((subCategory) => ({ category, subCategory })),
);

export function SubCategoryNavSection() {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <TypographyH2 className="mb-4 border-none text-xl font-bold">
          카테고리 둘러보기
        </TypographyH2>
        <Carousel
          aria-label="서브카테고리 바로가기"
          opts={{ align: "start", loop: false, dragFree: true }}
          plugins={[WheelGesturesPlugin()]}
        >
          <CarouselContent>
            {categorizedSubCategories.map(({ category, subCategory }) => (
              <CarouselItem key={`${category}-${subCategory}`} className="basis-auto">
                <SubCategoryNavItem category={category} subCategory={subCategory} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
