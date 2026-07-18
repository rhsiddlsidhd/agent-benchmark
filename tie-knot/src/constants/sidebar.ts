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
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "상품 관리",
    icon: Package,
    submenu: [
      { title: "상품 목록", href: "/admin/products" },
      { title: "상품 등록", href: "/admin/products/new" },
    ],
  },
  {
    title: "프리미엄 기능 관리",
    icon: Star,
    submenu: [
      { title: "프리미엄 기능 목록", href: "/admin/premium-features" },
      { title: "프리미엄 기능 등록", href: "/admin/premium-features/new" },
    ],
  },
  {
    title: "주문 관리",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "회원 관리",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "설정",
    href: "/admin/settings",
    icon: Settings,
  },
];

const AUTH_USER_ORDER_NAVIGATE_ITEMS: NavigateItem[] = [
  {
    title: "주문 정보",
    icon: ShoppingCart,
    submenu: [
      { title: "주문 목록", href: "/my-orders" },
      { title: "취소/환불", href: "/my-orders/refund" },
    ],
  },
  {
    title: "고객 센터",
    href: "/support",
    icon: HelpCircle,
  },
];

const AUTH_USER_PROFILE_NAVIGATE_ITEMS: NavigateItem[] = [
  {
    title: "프로필",
    href: "/profile",
    icon: LayoutDashboard,
  },
];

export const ALL_NAVIGATE_ITEMS = {
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
