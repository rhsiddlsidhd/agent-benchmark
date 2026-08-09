import { PagePath, PAGE_TITLE } from "@/shared/constants";

export const isPageTitle = (value: string): value is PagePath => {
  return Object.keys(PAGE_TITLE).includes(value);
};
