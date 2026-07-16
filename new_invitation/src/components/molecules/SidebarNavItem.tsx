"use client";
import { ALL_NAVIGATE_ITEMS, SubmenuParentTitle } from "@/constants/sidebar";
import { cn } from "@/lib/utils";
import { isSubmenuParentTitle } from "@/utils/sidebar";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { Button } from "@/components/atoms/button";

export default function SidebarNavItem({
  type,
}: {
  type: "ADMIN" | "MY_PROFILE" | "MY_ORDER";
}) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<SubmenuParentTitle[]>([
    "상품 관리",
    "프리미엄 기능 관리",
    "주문 정보",
  ]);

  const toggleMenu = (title: SubmenuParentTitle) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const data = ALL_NAVIGATE_ITEMS[type];

  return (
    <nav className="flex-1 overflow-y-auto">
      {data.map((item) => {
        const menuTitle =
          item.submenu && isSubmenuParentTitle(item.title) ? item.title : null;

        return (
          <div key={item.title}>
            {menuTitle ? (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleMenu(menuTitle)}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex w-full items-center justify-between px-6 py-3 text-sm transition-colors h-auto rounded-none"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedMenus.includes(menuTitle) && "rotate-180",
                    )}
                  />
                </Button>
                {expandedMenus.includes(menuTitle) && item.submenu && (
                  <div className="bg-accent/30">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "block py-2.5 pr-6 pl-14 text-sm transition-colors",
                          pathname === subItem.href
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        )}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href ?? "#"}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
                  pathname === item.href
                    ? "text-primary bg-primary/10 border-primary border-r-2 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
