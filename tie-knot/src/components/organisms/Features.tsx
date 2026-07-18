import { Card, CardContent } from "@/components/atoms/card";
import { Smartphone, Share2, Palette, Zap, Heart, Globe } from "lucide-react";
import React from "react";
import { TypographyH2, TypographyP, TypographyH3 } from "@/components/atoms/typoqraphy";

const features = [
  {
    icon: Smartphone,
    title: "모바일 최적화",
    description: "모든 스마트폰에서 완벽하게 보이는 반응형 디자인",
  },
  {
    icon: Palette,
    title: "다양한 템플릿",
    description: "당신의 스타일에 맞는 100+ 프리미엄 템플릿",
  },
  {
    icon: Share2,
    title: "간편한 공유",
    description: "링크 하나로 카카오톡, 문자로 즉시 전송",
  },
  {
    icon: Zap,
    title: "빠른 제작",
    description: "5분이면 완성! 복잡한 작업 없이 쉽고 빠르게",
  },
  {
    icon: Heart,
    title: "실시간 수정",
    description: "언제든지 내용 수정 가능, 다시 만들 필요 없음",
  },
  {
    icon: Globe,
    title: "방문자 통계",
    description: "누가, 언제 청첩장을 확인했는지 실시간으로",
  },
];

const Features = () => {
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <TypographyH2 className="text-foreground mb-4 border-none text-4xl font-bold text-balance md:text-5xl">
            {"왜 우리 서비스일까요?"}
          </TypographyH2>
          <TypographyP className="text-muted-foreground mx-auto max-w-2xl text-lg leading-7">
            {"결혼 준비로 바쁜 당신을 위한 가장 쉽고 빠른 모바일 청첩장 솔루션"}
          </TypographyP>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                  <feature.icon className="text-primary h-6 w-6" />
                </div>
                <TypographyH3 className="text-card-foreground mb-2 text-xl font-bold">
                  {feature.title}
                </TypographyH3>
                <TypographyP className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </TypographyP>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
