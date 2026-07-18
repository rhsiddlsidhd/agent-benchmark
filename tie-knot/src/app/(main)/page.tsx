export const revalidate = 3600;

import { StartActionCTA } from "@/components/organisms/StartActionCTA";
import { Footer } from "@/components/layout/Footer";
import { EcommerceHero } from "@/components/organisms/EcommerceHero";
import { LiveDemoSection } from "@/components/organisms/LiveDemoSection";
import {
  getFeaturedTemplatesService,
  getProductService,
  Product,
} from "@/services/product.service";
import React from "react";
import { TypographyH2, TypographyP } from "@/components/atoms/typoqraphy";
import { TemplateCarouselGroup } from "@/components/organisms/TemplateCarouselGroup";

const page = async () => {
  const previewProductId = process.env.NEXT_PUBLIC_MAIN_PREVIEW_PRODUCT_ID;
  const infoId = process.env.NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID;

  const [product, invitation, businessCard] = await Promise.all([
    previewProductId ? getProductService(previewProductId) : null,
    getFeaturedTemplatesService("invitation").catch(() => [] as Product[]),
    getFeaturedTemplatesService("business-card").catch(() => [] as Product[]),
  ]);

  return (
    <div className="flex flex-col">
      <EcommerceHero />

      {/* 추천 템플릿 섹션: 데이터가 있을 경우에만 렌더링 */}
      {(invitation.length > 0 || businessCard.length > 0) && (
        <section className="bg-white py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <TypographyH2 className="mb-4 border-none text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                베스트 디자인 템플릿
              </TypographyH2>
              <TypographyP className="mx-auto max-w-2xl text-lg text-slate-600">
                가장 많은 사랑을 받은 디자인들을 카테고리별로 확인해보세요.
              </TypographyP>
            </div>

            <div className="space-y-24">
              {invitation.length > 0 && (
                <TemplateCarouselGroup
                  data={invitation}
                  title="초대장"
                  description="소중한 순간을 함께할 분들께 마음을 전하는 초대장"
                />
              )}

              {businessCard.length > 0 && (
                <TemplateCarouselGroup
                  data={businessCard}
                  title="명함"
                  description="나를 가장 잘 표현하는 세련된 디지털 명함"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* 실제 샘플 미리보기 섹션 */}
      {product && infoId && (
        <LiveDemoSection product={product} infoId={infoId} />
      )}

      <StartActionCTA />
      <Footer />
    </div>
  );
};

export default page;
