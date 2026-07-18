import Image from "next/image";
import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { TypographySmall } from "@/components/atoms/typoqraphy";

const keyBenefits = ["신용카드 없이 시작", "5분 만에 완성", "무제한 공유"];

const index = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/assets/images/output.webp"
          alt="Wedding Background"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="bg-background/40 absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <div className="bg-secondary/80 text-secondary-foreground animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm">
          <Sparkles className="text-accent h-4 w-4" />
          <TypographySmall className="font-medium">
            {"2024년 1만+ 커플이 선택한 서비스"}
          </TypographySmall>
        </div>

        <h1 className="animate-fade-in-up text-foreground mb-6 text-5xl font-bold text-balance [animation-delay:100ms] md:text-7xl">
          {"당신의 특별한 날을"}
          <br />
          <span className="text-primary">{"더 아름답게"}</span>
        </h1>

        <p className="text-muted-foreground animate-fade-in-up mx-auto mb-8 max-w-2xl text-lg leading-relaxed [animation-delay:200ms] md:text-xl">
          {"간편하게 만들고, 쉽게 공유하는 모바일 청첩장."}
          <br />
          {"당신의 사랑 이야기를 아름답게 전달하세요."}
        </p>

        <div className="animate-fade-in-up flex flex-col items-center justify-center gap-4 [animation-delay:300ms] sm:flex-row">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 group"
          >
            {"무료로 시작하기"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-background/80 border-border backdrop-blur-sm"
          >
            {"템플릿 둘러보기"}
          </Button>
        </div>

        <div className="text-muted-foreground animate-fade-in-up mt-16 grid grid-cols-3 gap-8 text-sm [animation-delay:400ms] max-sm:grid-cols-1">
          {keyBenefits.map((text, i) => (
            <div
              key={`${text}-${i}`}
              className="bg-accent flex items-center justify-center gap-2 rounded-full px-4 py-2"
            >
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-accent/20 absolute top-20 left-10 h-20 w-20 animate-pulse rounded-full blur-3xl" />
      <div className="bg-primary/20 absolute right-10 bottom-20 h-32 w-32 animate-pulse rounded-full blur-3xl [animation-delay:1s]" />
    </section>
  );
};

export default index;
