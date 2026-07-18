import { AuthButtons } from "@/components/organisms/AuthButtons";
import MobileNav from "@/components/organisms/MobileNav";
import Link from "next/link";
import React from "react";
import { MAIN_NAV_ITEMS } from "@/constants/navigation";
import { TypographyH4 } from "../atoms/typoqraphy";

const Header = () => {
  return (
    <header className="bg-background/80 border-border sticky top-0 right-0 left-0 z-50 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Mobile Navigation */}
        <div className="flex md:hidden">
          <MobileNav />
        </div>

        {/* Logo */}
        <Link href="/">
          <TypographyH4 className="m-0">Tie Knot</TypographyH4>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {MAIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth / Action Buttons */}
        <div className="flex items-center gap-2">
          <AuthButtons />
        </div>
      </div>
    </header>
  );
};

export default Header;
