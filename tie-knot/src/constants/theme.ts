export type InvitationTheme = "blossom" | "default";

export const PRODUCT_THEME_MAP: Record<string, InvitationTheme> = {
  "69afb24d31ac12bafa1a302c": "blossom",
};

export const getThemeByProductId = (productId?: string): InvitationTheme => {
  if (!productId) return "default";
  return PRODUCT_THEME_MAP[productId] ?? "default";
};
