import { ContentCard } from "@/src/components/ui";
import type { CardItem } from "../_types";
import styles from "../home.module.css";

/** 캐러셀 섹션 — h2 헤더 + 가로 스크롤 ContentCard 레일. */
export function CarouselSection({
  title,
  items,
}: {
  title: string;
  items: CardItem[];
}) {
  return (
    <section aria-label={title} className="mx-auto w-full max-w-page">
      <h2 className="px-gutter text-h2 text-content-primary md:px-gutter-lg">
        {title}
      </h2>
      <ul className={`mt-4 ${styles.rail}`}>
        {items.map((item, index) => (
          <li key={`${item.href}-${index}`} className={styles.railItem}>
            <ContentCard
              href={item.href}
              title={item.title}
              posterPath={item.posterPath}
              year={item.year}
              rating={item.rating}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
