export type InvitationTheme = "blossom" | "default";

export const INVITATION_THEME_LABELS: Record<InvitationTheme, string> = {
  default: "기본",
  blossom: "벚꽃",
};

export const getInvitationThemeOptions = () =>
  Object.entries(INVITATION_THEME_LABELS).map(([value, label]) => ({
    value: value as InvitationTheme,
    label,
  }));
