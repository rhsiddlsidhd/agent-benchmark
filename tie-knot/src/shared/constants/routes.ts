import type { SubCategory } from "@/shared/utils";

export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  findId: "/find-id",
  findPw: "/find-pw",
  changePw: "/change-pw",
  profile: "/my-profile",
  support: "/support",
  search: "/search",
  reviews: "/reviews",
  deliveryInfo: "/delivery-info",
  payment: {
    root: "/payment",
    success: "/payment/success",
  },
  myOrders: {
    root: "/my-orders",
    edit: "/my-orders/edit",
    refund: "/my-orders/refund",
    coupleInfo: "/my-orders/couple-info",
  },
  products: {
    root: "/products",
    // subCategory를 안 넘기면 기존 동작 그대로 → 기존 호출부(navigation.ts, SearchEmptyState.tsx) 무회귀
    byCategory: (category: string, subCategory?: SubCategory) =>
      subCategory
        ? `/products/${category}?subCategory=${subCategory}`
        : `/products/${category}`,
    detail: (category: string, id: string) => `/products/${category}/${id}`,
  },
  preview: {
    detail: (id: string) => `/preview/${id}`,
  },
  admin: {
    dashboard: "/admin/dashboard",
    orders: "/admin/orders",
    users: "/admin/users",
    settings: "/admin/settings",
    products: {
      root: "/admin/products",
      new: "/admin/products/new",
    },
    premiumFeatures: {
      root: "/admin/premium-features",
      new: "/admin/premium-features/new",
    },
  },
} as const;
