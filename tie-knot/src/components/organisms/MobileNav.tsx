"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Gem } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/constants/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/atoms/sheet";
import { Button } from "@/components/atoms/button";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground hover:text-foreground/70 transition-colors hover:bg-transparent md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="border-border/50 flex w-72 flex-col border-r p-0 [&>button:last-of-type]:hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground flex items-center gap-2 text-base font-semibold tracking-widest uppercase">
              <Gem
                className="text-muted-foreground h-4 w-4"
                strokeWidth={1.5}
              />
              Tie Knot
            </SheetTitle>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground -mr-1 p-1 transition-colors"
              aria-label="메뉴 닫기"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Decorative divider */}
          <div className="mt-5 flex items-center gap-3">
            <div className="bg-border/60 h-px flex-1" />
            <span className="text-muted-foreground/50 text-[10px] font-medium tracking-[0.25em] uppercase">
              Menu
            </span>
            <div className="bg-border/60 h-px flex-1" />
          </div>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 px-4 pt-4">
          {MAIN_NAV_ITEMS.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="group text-muted-foreground hover:text-foreground hover:bg-muted/50 relative flex items-center gap-3 rounded-lg px-3 py-3.5 transition-all duration-200"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Accent bar */}
              <span className="bg-foreground/80 absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full opacity-0 transition-all duration-200 group-hover:opacity-100" />
              <span className="text-muted-foreground/40 group-hover:text-muted-foreground/60 w-4 text-right text-[11px] font-medium tabular-nums transition-colors">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-border/40 border-t px-6 py-5">
          <p className="text-muted-foreground/40 text-center text-[10px] tracking-[0.15em] uppercase">
            모바일 청첩장 &amp; 명함 서비스
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
