"use client";

import { Sparkles } from "lucide-react";
import { Product } from "@/services/product.service";

import { calculatePrice } from "@/utils/price";
import { useRouter } from "next/navigation";
import { SubCategory, subCategoryLabels } from "@/utils/category";
import { Badge } from "../atoms/badge";
import { TypographyMuted } from "../atoms/typoqraphy";
import CloudImage from "../molecules/CloudImage";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  const finalPrice =
    product.discount?.value > 0
      ? calculatePrice(product.price, product.discount)
      : product.price;

  const hasDiscount = product.discount?.value > 0;
  const discountLabel = hasDiscount
    ? product.discount.discountType === "rate"
      ? `${Math.round(product.discount.value * 100)}% OFF`
      : `${product.discount.value.toLocaleString()}원 할인`
    : null;

  return (
    <article
      className="group relative cursor-pointer"
      onClick={() => router.push(`/products/${product._id}`)}
    >
      {/* Image — the card itself */}
      <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-neutral-100">
        {/* Thumbnail with zoom on hover */}
        <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06]">
          <CloudImage
            src={product.thumbnail}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            alt={`${product.title} 썸네일`}
            priority={true}
          />
        </div>

        {/* Persistent bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Hover overlay deepens */}
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Top badges */}
        <div className="absolute top-3 right-3 left-3 flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            {product.isPremium && (
              <Badge className="border-transparent bg-amber-400/95 tracking-widest uppercase shadow-sm backdrop-blur-sm">
                <Sparkles className="h-2.5 w-2.5 text-amber-950" />
                <TypographyMuted className="text-[10px] font-bold text-amber-950">
                  Premium
                </TypographyMuted>
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="border-transparent bg-white/90 tracking-widest uppercase backdrop-blur-sm">
                <TypographyMuted className="text-[10px] font-bold text-neutral-700">
                  추천
                </TypographyMuted>
              </Badge>
            )}
          </div>
          {discountLabel && (
            <Badge className="border-transparent bg-rose-500 tracking-wide shadow-sm backdrop-blur-sm">
              <TypographyMuted className="text-[10px] font-bold text-white">
                {discountLabel}
              </TypographyMuted>
            </Badge>
          )}
        </div>

        {/* Bottom info — always visible */}
        <div className="absolute inset-x-0 bottom-0 p-4 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
          <p className="mb-1 text-[9px] font-semibold tracking-[0.25em] text-white/50 uppercase">
            {subCategoryLabels[product.subCategory as SubCategory] ??
              product.subCategory}
          </p>
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-white">
            {product.title}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              {hasDiscount && (
                <span className="text-[11px] text-white/35 line-through">
                  {product.price.toLocaleString()}원
                </span>
              )}
              <span className="text-base font-bold text-white">
                {finalPrice === 0 ? "무료" : `${finalPrice.toLocaleString()}원`}
              </span>
            </div>
            <span className="text-[11px] text-white/40">
              좋아요 {product.likes?.length || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
