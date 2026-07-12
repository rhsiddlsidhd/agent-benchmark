import { ContentCard, ScrollRail } from "@/src/components/ui";
import type { CardItem } from "../_types";

/** 캐러셀 섹션 — h2 헤더 + ScrollRail(드래그/키보드 스크롤 가능한 ContentCard 레일). */
export function CarouselSection({
  title,
  items,
}: {
  title: string;
  items: CardItem[];
}) {
  return (
    <section aria-label={title} className="mx-auto w-full max-w-page">
      <h2 className="mb-3 flex items-center gap-3 px-gutter text-h2 text-content-primary md:px-gutter-lg">
        <span aria-hidden className="h-6 w-1 rounded-pill bg-brand" />
        {title}
      </h2>
      <ScrollRail>
        {items.map((item, index) => (
          <li key={`${item.href}-${index}`}>
            <ContentCard
              href={item.href}
              title={item.title}
              posterPath={item.posterPath}
              year={item.year}
              rating={item.rating}
              adult={item.adult}
            />
          </li>
        ))}
      </ScrollRail>
    </section>
  );
}
