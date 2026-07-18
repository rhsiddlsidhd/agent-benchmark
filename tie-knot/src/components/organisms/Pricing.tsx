import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Check } from "lucide-react";
import { TypographyH2, TypographyP, TypographyMuted, TypographySmall } from "@/components/atoms/typoqraphy";

const plans = [
  {
    name: "프리",
    price: "무료",
    description: "처음 시작하는 커플에게",
    features: [
      "기본 템플릿 5개",
      "모바일 최적화",
      "링크 공유",
      "방문자 수 확인",
      "7일 수정 가능",
    ],
  },
  {
    name: "프리미엄",
    price: "29,000원",
    popular: true,
    description: "가장 인기있는 플랜",
    features: [
      "모든 프리미엄 템플릿",
      "무제한 수정",
      "상세 방문자 통계",
      "사진 갤러리 무제한",
      "커스텀 도메인",
      "광고 없음",
    ],
  },
  {
    name: "프리미엄 플러스",
    price: "49,000원",
    description: "완벽한 결혼식을 위해",
    features: [
      "프리미엄의 모든 기능",
      "전문가 디자인 상담",
      "동영상 삽입",
      "축의금 계좌 안내",
      "참석 여부 확인",
      "평생 보관",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-white py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <TypographyH2 className="text-foreground mb-4 border-none text-4xl font-bold text-balance md:text-5xl">
            {"합리적인 가격"}
          </TypographyH2>
          <TypographyP className="text-muted-foreground mx-auto max-w-2xl text-lg">
            {"결혼 준비 예산에 부담 없는 가격으로 시작하세요"}
          </TypographyP>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`border-border bg-card relative ${plan.popular ? "border-primary scale-105 shadow-xl" : ""}`}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-medium">
                  {"인기"}
                </div>
              )}
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-card-foreground text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-primary text-4xl font-bold">
                    {plan.price}
                  </span>
                  {plan.price !== "무료" && (
                    <span className="text-muted-foreground ml-1">
                      {"/평생"}
                    </span>
                  )}
                </div>
                <TypographyMuted className="mt-2">
                  {plan.description}
                </TypographyMuted>
              </CardHeader>
              <CardContent>
                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="text-accent mt-0.5 h-5 w-5 shrink-0" />
                      <TypographySmall className="text-card-foreground font-normal">
                        {feature}
                      </TypographySmall>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  }`}
                >
                  {plan.price === "무료" ? "무료로 시작하기" : "지금 시작하기"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
