import { AuthButtons } from "./AuthButtons";
import { MobileNav } from "@/client/components/organisms";
import Link from "next/link";
import React from "react";
import { Search } from "lucide-react";
import { routes, PRODUCT_CATEGORIES, productCategoryLabels } from "@/shared/constants";
import { Button, TypographyH4 } from "@/client/components/atoms";
const Header = () => {
  return (
    <header className="bg-background/80 border-border sticky top-0 right-0 left-0 z-50 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <div className="md:hidden">
            <MobileNav />
          </div>

          {/* Logo */}
          <Link href={routes.home}>
            <TypographyH4 className="m-0">Tie Knot</TypographyH4>
          </Link>

          <nav aria-label="카테고리" className="hidden items-center gap-1 md:flex">
            {PRODUCT_CATEGORIES.map((category) => (
              <Button key={category} asChild variant="ghost" size="sm">
                <Link href={routes.products.byCategory(category)}>
                  {productCategoryLabels[category]}
                </Link>
              </Button>
            ))}
            <Button asChild variant="ghost" size="sm">
              <Link href={routes.reviews}>고객후기</Link>
            </Button>
          </nav>
        </div>

        {/* Auth / Action Buttons */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="상품 검색">
            <Link href={routes.search}>
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </Button>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
};

export { Header };
