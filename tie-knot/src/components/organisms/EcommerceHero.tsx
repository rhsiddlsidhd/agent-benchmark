"use client";

import Image from "next/image";
import React, { useState } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  History,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import promotions from "@/data/promotions.json";
import { useIntervalIndex } from "@/hooks/useIntervalIndex";
import { TypographyH2, TypographySmall } from "@/components/atoms/typoqraphy";

// 아이콘 매핑 객체
const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Image: ImageIcon,
  MessageSquare,
  History,
};

export const EcommerceHero = () => {
  const [isPaused, setIsPaused] = useState(false);

  const { currentIndex, setIndex } = useIntervalIndex({
    length: promotions.length,
    interval: 5000,
    isPaused,
  });

  const activePromotion = promotions[currentIndex];

  return (
    <section
      className="relative overflow-hidden bg-white pt-20 md:pt-28"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-4">
        {/* Layout: Mobile (Banner Top, Tabs Bottom) / Desktop (Tabs Left, Banner Right) */}
        <div className="flex flex-col-reverse gap-8 py-8 md:flex-row md:items-stretch md:py-12">
          {/* Tabs Section (Left on Desktop, Bottom on Mobile) - 비즈니스 프로모션 선택 영역 */}
          <div className="flex w-full flex-col justify-center gap-2 md:w-1/3 lg:w-1/4">
            <div className="mb-6 hidden md:block">
              <TypographyH2 className="border-none text-2xl font-bold text-slate-900">
                당신의 특별한 날을 위한
                <br />
                프리미엄 솔루션
              </TypographyH2>
            </div>
            <div className="grid grid-cols-2 gap-2 md:flex md:flex-col md:gap-3">
              {promotions.map((promo, index) => {
                const isActive = activePromotion.id === promo.id;
                const Icon = ICON_MAP[promo.iconName] || Sparkles;

                return (
                  <Button
                    key={promo.id}
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIndex(index);
                      setIsPaused(true);
                    }}
                    className={cn(
                      "group relative flex h-auto items-center gap-3 rounded-2xl p-4 text-left transition-all duration-300",
                      isActive
                        ? "bg-white shadow-xl ring-1 shadow-slate-200/50 ring-slate-100"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                        isActive
                          ? promo.bgColor
                          : "bg-slate-100 group-hover:bg-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isActive ? promo.accentColor : "text-slate-400",
                        )}
                      />
                    </div>
                    <div className="flex flex-col">
                      <TypographySmall
                        className={cn(
                          "font-bold transition-colors",
                          isActive ? "text-slate-900" : "text-slate-500",
                        )}
                      >
                        {promo.label}
                      </TypographySmall>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 z-[-1] rounded-2xl bg-white shadow-lg"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Banner Showcase Area */}
          <div className="relative flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePromotion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "relative flex h-full min-h-[450px] flex-col overflow-hidden rounded-[2.5rem] p-8 md:flex-row md:items-center md:p-12",
                  activePromotion.bgColor,
                )}
              >
                {/* Content Side */}
                <div className="relative z-10 flex flex-1 flex-col justify-center text-center md:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4 inline-flex w-fit items-center gap-2 self-center rounded-full bg-white/80 px-4 py-2 backdrop-blur-sm md:self-start"
                  >
                    <Sparkles
                      className={cn("h-4 w-4", activePromotion.accentColor)}
                    />
                    <TypographySmall className="font-bold tracking-widest text-slate-600 uppercase">
                      {activePromotion.badge}
                    </TypographySmall>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6 text-3xl leading-tight font-extrabold text-slate-900 md:text-5xl lg:text-6xl"
                  >
                    {activePromotion.title.split("\n").map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8 text-base leading-relaxed whitespace-pre-line text-slate-600 md:text-lg"
                  >
                    {activePromotion.description}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start"
                  >
                  </motion.div>
                </div>

                {/* Image Side */}
                <div className="relative mt-8 flex flex-1 items-center justify-center md:mt-0">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="relative aspect-[3/4] w-full max-w-[320px] rotate-3 overflow-hidden rounded-3xl shadow-2xl transition-transform hover:rotate-0"
                  >
                    <Image
                      src={activePromotion.image}
                      alt={activePromotion.label}
                      fill
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                  {/* Decorative blobs based on active promotion color */}
                  <div
                    className={cn(
                      "absolute -top-8 -right-8 h-48 w-48 rounded-full opacity-40 blur-3xl",
                      activePromotion.accentColor.replace("text", "bg"),
                    )}
                  />
                  <div
                    className={cn(
                      "absolute -bottom-8 -left-8 h-48 w-48 rounded-full opacity-20 blur-3xl",
                      activePromotion.accentColor.replace("text", "bg"),
                    )}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
