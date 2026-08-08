import Link from "next/link";
import { TypographyH4, TypographySmall } from "@/client/components/atoms";
import { routes, PRODUCT_CATEGORIES, productCategoryLabels } from "@/shared/constants";

export function Footer() {
  return (
    <footer className="border-border border-t bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-4 md:text-left">
          <div>
            <TypographyH4 className="mb-2">Tie Knot</TypographyH4>
            <p className="text-muted-foreground mx-auto max-w-xs text-sm leading-relaxed md:mx-0">
              {"당신의 특별한 날을 더 아름답게 만드는 모바일 청첩장 서비스"}
            </p>
          </div>

          <div className="hidden md:block">
            <TypographySmall className="text-foreground mb-3 block font-semibold">
              쇼핑 카테고리
            </TypographySmall>
            <ul className="text-muted-foreground space-y-2 text-sm">
              {PRODUCT_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    href={routes.products.byCategory(category)}
                    className="hover:text-foreground"
                  >
                    {productCategoryLabels[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <TypographySmall className="text-foreground mb-3 block font-semibold">
              고객지원
            </TypographySmall>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href={routes.support} className="hover:text-foreground">
                  고객센터
                </Link>
              </li>
              <li>
                <Link href={routes.reviews} className="hover:text-foreground">
                  고객후기
                </Link>
              </li>
            </ul>
          </div>

          <div className="hidden md:block">
            <TypographySmall className="text-foreground mb-3 block font-semibold">
              계정
            </TypographySmall>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href={routes.login} className="hover:text-foreground">
                  로그인
                </Link>
              </li>
              <li>
                <Link href={routes.signup} className="hover:text-foreground">
                  회원가입
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-8 border-t pt-8 text-center text-sm">
          <p>{"© 2026 Tie Knot. All rights reserved."}</p>
        </div>
      </div>
    </footer>
  );
}
