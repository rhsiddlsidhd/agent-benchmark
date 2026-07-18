export const revalidate = 600;

import { Badge } from "@/components/atoms/badge";
import { Card, CardContent } from "@/components/atoms/card";
import Grid from "@/components/layout/Grid";
import PremiumFeatureCardAction from "@/components/organisms/PremiumFeatureCardAction";
import { getAllPremiumFeatureService } from "@/services/premiumFeature.service";
import {
  TypographyH1,
  TypographyH3,
  TypographyLarge,
  TypographyMuted,
} from "@/components/atoms/typoqraphy";

export default async function PremiumFeaturesPage() {
  const features = await getAllPremiumFeatureService();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <TypographyH1 className="mb-2 text-left text-3xl font-bold">
            프리미엄 기능 관리
          </TypographyH1>
          <TypographyMuted>
            상품에 추가할 수 있는 유료 기능을 관리합니다.
          </TypographyMuted>
        </div>
      </div>

      <Grid slot="admin-premium-features">
        {features.map((feature) => (
          <Card key={feature.code}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <TypographyH3 className="text-foreground text-lg font-semibold">
                      {feature.label}
                    </TypographyH3>
                    <Badge variant="outline" className="text-xs">
                      {feature.code}
                    </Badge>
                  </div>
                  <TypographyMuted>{feature.description}</TypographyMuted>
                </div>
              </div>

              <div className="border-border flex items-center justify-between border-t pt-4">
                <div>
                  <TypographyMuted className="mb-1">추가 비용</TypographyMuted>
                  <TypographyLarge className="text-primary font-bold">
                    +{feature.additionalPrice.toLocaleString()}원
                  </TypographyLarge>
                </div>
                <div className="flex gap-2">
                  <PremiumFeatureCardAction premiumFeature={feature} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
