import {
  HelpCircle,
  LayoutDashboard,
  LucideProps,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";

import { routes } from "./routes";

export interface BaseNavigateItem {
  title: string;
}

export interface NavigateLinkItem extends BaseNavigateItem {
  href: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  submenu?: never;
}

export interface NavigateGroupItem extends BaseNavigateItem {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  submenu: Submenu[];
  href?: never;
}

export type NavigateItem = NavigateLinkItem | NavigateGroupItem;

export type Submenu = {
  title: string;
  href: string;
};

const ADMIN_NAVIGATE_ITEMS: NavigateItem[] = [
  {
    title: "대시보드",
    href: routes.admin.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: "상품 관리",
    icon: Package,
    submenu: [
      { title: "상품 목록", href: routes.admin.products.root },
      { title: "상품 등록", href: routes.admin.products.new },
    ],
  },
  {
    title: "프리미엄 기능 관리",
    icon: Star,
    submenu: [
      { title: "프리미엄 기능 목록", href: routes.admin.premiumFeatures.root },
      { title: "프리미엄 기능 등록", href: routes.admin.premiumFeatures.new },
    ],
  },
  {
    title: "주문 관리",
    href: routes.admin.orders,
    icon: ShoppingCart,
  },
  {
    title: "회원 관리",
    href: routes.admin.users,
    icon: Users,
  },
  {
    title: "설정",
    href: routes.admin.settings,
    icon: Settings,
  },
];

const AUTH_USER_ORDER_NAVIGATE_ITEMS: NavigateItem[] = [
  {
    title: "주문 정보",
    icon: ShoppingCart,
    submenu: [
      { title: "주문 목록", href: routes.myOrders.root },
      { title: "취소/환불", href: routes.myOrders.refund },
    ],
  },
  {
    title: "고객 센터",
    href: routes.support,
    icon: HelpCircle,
  },
];

const AUTH_USER_PROFILE_NAVIGATE_ITEMS: NavigateItem[] = [
  {
    title: "프로필",
    href: routes.profile,
    icon: LayoutDashboard,
  },
];

export const allNavigateItems = {
  ADMIN: ADMIN_NAVIGATE_ITEMS,
  MY_ORDER: AUTH_USER_ORDER_NAVIGATE_ITEMS,
  MY_PROFILE: AUTH_USER_PROFILE_NAVIGATE_ITEMS,
} as const;

export const SUBMENU_PARENT_TITLES = [
  "프리미엄 기능 관리",
  "주문 정보",
  "상품 관리",
] as const;

export type SubmenuParentTitle = (typeof SUBMENU_PARENT_TITLES)[number];
