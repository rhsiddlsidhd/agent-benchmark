import { SubCategory } from "@/utils/category";
import { ProductPriceType, ProductSortType } from "@/constants/product";

export type ProductFilterState = {
  keyword: string;
  subCategory: SubCategory | "all";
  isOpen: boolean;
  sortBy: ProductSortType;
  price: ProductPriceType;
  premiumFeat: string[];
};

export type ProductFilterAction =
  | { type: "CHANGE_KEYWORD"; payload: string }
  | { type: "SELECT_SUB_CATEGORY"; payload: ProductFilterState["subCategory"] }
  | { type: "OPEN_SUGGESTIONS" }
  | { type: "CLOSE_SUGGESTIONS" }
  | { type: "SELECT_SORT_BY"; payload: ProductFilterState["sortBy"] }
  | { type: "SELECT_PRICE"; payload: ProductFilterState["price"] }
  | {
      type: "SELECT_PREMIUM_FEAT";
      payload: ProductFilterState["premiumFeat"][number];
    }
  | { type: "CLEAR_DETAIL_FILTER"; payload: null };
