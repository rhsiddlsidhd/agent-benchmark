/**
 * 감사 대상 라우트 정의.
 * auth: 'none' | 'entry' | 'user' | 'admin' | 'couple-info'
 * - none: 쿠키 없이 접근 (공개 페이지)
 * - entry: /api/auth/entry로 발급받은 entry 쿠키 필요 (로그인 페이지 자체)
 * - user: 일반 유저 로그인 쿠키 필요
 * - admin: admin 로그인 쿠키 필요
 * - couple-info: 유저 로그인 쿠키 + sessionStorage(order-storage) 주입 필요
 *
 * 제외: /change-pw(실제 비번찾기 이메일 흐름 필요, 가치 낮음),
 *       /payment, /order/edit(진짜 coupleInfoId 생성 흐름 필요 — 추후 흐름 개선 시 추가)
 */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 필요합니다.`);
  return value;
}

const routes = [
  { key: "home", path: "/", auth: "none" },
  { key: "reviews", path: "/reviews", auth: "none" },
  { key: "products-list", path: "/products?category=invitation", auth: "none" },
  {
    key: "product-detail",
    path: () => `/products/${requireEnv("NEXT_PUBLIC_MAIN_PREVIEW_PRODUCT_ID")}`,
    auth: "none",
  },
  {
    key: "preview",
    path: () => `/preview/${requireEnv("NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID")}`,
    auth: "none",
  },
  { key: "signup", path: "/signup", auth: "none" },
  { key: "find-id", path: "/find-id", auth: "none" },
  { key: "find-pw", path: "/find-pw", auth: "none" },
  { key: "login", path: "/login", auth: "entry" },

  { key: "profile", path: "/profile", auth: "user" },
  { key: "order", path: "/order", auth: "user" },
  { key: "couple-info", path: "/couple-info", auth: "couple-info" },

  { key: "admin-dashboard", path: "/admin/dashboard", auth: "admin" },
  { key: "admin-orders", path: "/admin/orders", auth: "admin" },
  { key: "admin-premium-features", path: "/admin/premium-features", auth: "admin" },
  { key: "admin-products", path: "/admin/products", auth: "admin" },
  { key: "admin-settings", path: "/admin/settings", auth: "admin" },
  { key: "admin-users", path: "/admin/users", auth: "admin" },
];

module.exports = {
  routes,
  FORM_FACTORS: ["mobile", "desktop"],
  NUMBER_OF_RUNS: 3,
};
