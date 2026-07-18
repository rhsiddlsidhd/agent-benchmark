import { Card } from "@/components/atoms/card";
import { PremiumFeature } from "@/services/premiumFeature.service";
import clsx from "clsx";
import { Check, Palette, Type, Settings, FileText } from "lucide-react";
import { TypographyH2, TypographyH3, TypographyMuted } from "@/components/atoms/typoqraphy";

interface ProductFeaturesProps {
  options: PremiumFeature[];
}

export function ProductFeatures({ options }: ProductFeaturesProps) {
  const icons = [Check, Palette, Type, Settings];

  return (
    <div className="mb-16 space-y-12">
      {/* Features List */}
      <div className={clsx(options.length === 0 && "hidden")}>
        <TypographyH2 className="text-foreground mb-6 border-none text-3xl font-bold">주요 옵션</TypographyH2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {options.map((feature, index) => {
            let Icon;
            if (feature.label.includes("PDF")) {
              Icon = FileText;
            } else {
              Icon = icons[index % icons.length];
            }
            return (
              <Card key={index} className="border-border flex flex-col p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <TypographyH3 className="text-foreground text-sm font-semibold">
                    {feature.label}
                  </TypographyH3>
                </div>
                <TypographyMuted>
                  {feature.description}
                </TypographyMuted>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Detailed Features */}
      <div>
        <TypographyH2 className="text-foreground mb-6 border-none text-3xl font-bold">상세 정보</TypographyH2>
      </div>
    </div>
  );
}
