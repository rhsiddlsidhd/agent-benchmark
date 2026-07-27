import { openApp } from "@/client/utils";
import { LayoutDashboard, User, ShoppingBag } from "lucide-react";

import { routes } from "./routes";

export const navigationButtons = [
  {
    name: "네이버지도",
    path: "navermap.webp",
    onClick: ({
      current,
      target,
      address,
    }: {
      current: { lng: number | null; lat: number | null };
      target: { lng: number | null; lat: number | null };
      address: string;
    }) =>
      current &&
      target &&
      address &&
      openApp.openNaverMap({ current, target, address }),
  },
  {
    name: "티맵",
    path: "tmap.webp",
    onClick: ({ address }: { address: string }) =>
      address && openApp.openTmap(address),
  },
  {
    name: "카카오내비",
    path: "kakaonavi.webp",
    onClick: ({
      current,
      target,
      address,
    }: {
      current: { lng: number | null; lat: number | null };
      target: { lng: number | null; lat: number | null };
      address: string;
    }) =>
      current &&
      target &&
      address &&
      openApp.openKakaoMap({ current, target, address }),
  },
] as const;

export const MAIN_NAV_ITEMS = [
  {
    id: "invitation",
    label: "모바일 청첩장",
    href: routes.products.byCategory("invitation"),
  },
  {
    id: "reviews",
    label: "고객후기",
    href: routes.reviews,
  },
] as const;

export const USER_NAV_ITEMS = [
  {
    label: "관리자 페이지",
    href: routes.admin.dashboard,
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    label: "마이 프로필",
    href: routes.profile,
    icon: User,
    adminOnly: false,
  },
  {
    label: "마이 주문",
    href: routes.myOrders.root,
    icon: ShoppingBag,
    adminOnly: false,
  },
] as const;
