export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  findId: "/find-id",
  findPw: "/find-pw",
  changePw: "/change-pw",
  profile: "/my-profile",
  support: "/support",
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
    byCategory: (category: string) => `/products/${category}`,
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
