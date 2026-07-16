import { getAllPremiumFeatureService } from "@/services/premiumFeature.service";
import { Button } from "@/components/atoms/button";
import { ProductRegistrationForm } from "@/components/organisms/ProductRegistrationForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";

export default async function NewProductPage() {
  const premiumFeatures = await getAllPremiumFeatureService();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <TypographyH1 className="text-left mb-2 text-3xl font-bold">상품 등록</TypographyH1>
          <TypographyMuted>
            새로운 템플릿 상품을 등록합니다.
          </TypographyMuted>
        </div>
      </div>

      <ProductRegistrationForm premiumFeatures={premiumFeatures} />
    </div>
  );
}
