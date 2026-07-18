import { SUBMENU_PARENT_TITLES, SubmenuParentTitle } from "@/constants/sidebar";

export const isSubmenuParentTitle = (
  title: string,
): title is SubmenuParentTitle =>
  SUBMENU_PARENT_TITLES.includes(title as SubmenuParentTitle);
