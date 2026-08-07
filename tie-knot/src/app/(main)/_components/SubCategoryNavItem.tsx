import Link from "next/link";
import { TypographySmall } from "@/client/components/atoms";
import { routes, subCategoryLabels, type ProductCategory, type SubCategory } from "@/shared/constants";
import { subCategoryIcons } from "../_constants";

interface SubCategoryNavItemProps {
  category: ProductCategory;
  subCategory: SubCategory;
}

export function SubCategoryNavItem({ category, subCategory }: SubCategoryNavItemProps) {
  const Icon = subCategoryIcons[subCategory];
  
  return (
    <Link
      href={routes.products.byCategory(category, subCategory)}
      className="flex min-h-11 min-w-11 shrink-0 flex-col items-center gap-2 px-2"
    >
      <span className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <TypographySmall>{subCategoryLabels[subCategory]}</TypographySmall>
    </Link>
  );
}
