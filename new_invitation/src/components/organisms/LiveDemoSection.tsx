import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { ProductJSON } from "@/models/product.model";

interface LiveDemoSectionProps {
  product: ProductJSON;
  infoId: string;
}

/**
 * 메인 페이지에서 실제 제작된 초대장 예시를 보여주는 섹션 (Organism)
 */
export const LiveDemoSection = ({ product, infoId }: LiveDemoSectionProps) => {
  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-stretch">
          {/* 설명 영역 */}
          <div className="flex flex-1 flex-col justify-center text-center lg:text-left">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              실제 제작된 초대장을 <br className="hidden sm:block" />
              지금 바로 확인해보세요
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              {product.title} 청첩장으로 제작된 실제 예시입니다.
              <br className="hidden sm:block" />
              모바일에서 최적화된 유려한 애니메이션과 디자인을 직접
              경험해보세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href={`/preview/${infoId}?product=${product._id}`}
                target="_blank"
              >
                <Button size="lg" className="h-12 px-8 text-base">
                  <Eye className="mr-2 h-5 w-5" />
                  샘플 미리보기
                </Button>
              </Link>
            </div>
          </div>

          {/* 비주얼 카드 영역 */}
          <div className="flex-1">
            <Card className="border-border overflow-hidden border-2 p-0 shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-background group relative aspect-16/10 w-full overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Link
                      href={`/preview/${infoId}?product=${product._id}`}
                      target="_blank"
                      className="scale-95 transform transition-transform duration-300 group-hover:scale-100"
                    >
                      <Button variant="secondary" className="font-semibold">
                        <ExternalLink className="mr-2 h-4 w-4" />새 창에서 열기
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
