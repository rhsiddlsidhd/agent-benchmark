import { TypographyH2 } from "@/client/components/atoms";
import { SUB_CATEGORY_MAP, type ProductCategory } from "@/shared/utils";
import { SubCategoryNavItem } from "./SubCategoryNavItem";

interface SubCategoryNavSectionProps {
  category: ProductCategory;
}

export function SubCategoryNavSection({ category }: SubCategoryNavSectionProps) {
  const subCategories = SUB_CATEGORY_MAP[category];

  if (!subCategories.length) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <TypographyH2 className="mb-4 border-none text-xl font-bold">
          초대장, 무엇을 찾으세요?
        </TypographyH2>
        <nav aria-label="서브카테고리 바로가기">
          <ul className="flex gap-4 overflow-x-auto">
            {subCategories.map((subCategory) => (
              <li key={subCategory}>
                <SubCategoryNavItem category={category} subCategory={subCategory} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
