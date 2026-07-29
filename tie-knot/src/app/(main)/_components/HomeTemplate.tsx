import { StartActionCTA, EcommerceHero, LiveDemoSection, TemplateCarouselGroup } from "@/client/components/organisms";
import { Product } from "@/server/services";
import { TypographyH2, TypographyP } from "@/client/components/atoms";
import { Footer } from "./Footer";

interface HomeTemplateProps {
  invitation: Product[];
  product: Product | null;
  infoId: string | undefined;
}

const HomeTemplate = ({ invitation, product, infoId }: HomeTemplateProps) => {
  return (
    <div className="flex flex-col">
      <EcommerceHero />

      {/* 추천 템플릿 섹션: 데이터가 있을 경우에만 렌더링 */}
      {invitation.length > 0 && (
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
              <TemplateCarouselGroup
                data={invitation}
                title="초대장"
                description="소중한 순간을 함께할 분들께 마음을 전하는 초대장"
              />
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

export { HomeTemplate };
