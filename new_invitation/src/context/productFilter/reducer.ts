import { useReducer } from "react";
import { createStateContext } from "../createStateContext";
import { ProductFilterAction, ProductFilterState } from "./type";

const initialFilterState: ProductFilterState = {
  keyword: "",
  subCategory: "all",
  isOpen: false,
  sortBy: "ALL",
  price: "ALL",
  premiumFeat: [],
};

function filterReducer(
  state: ProductFilterState,
  action: ProductFilterAction,
): ProductFilterState {
  switch (action.type) {
    case "CHANGE_KEYWORD":
      return {
        ...state,
        keyword: action.payload,
      };

    case "SELECT_SUB_CATEGORY":
      return {
        ...state,
        subCategory: action.payload,
      };
    case "OPEN_SUGGESTIONS":
      return {
        ...state,
        isOpen: true,
      };
    case "CLOSE_SUGGESTIONS":
      return {
        ...state,
        isOpen: false,
      };
    case "SELECT_SORT_BY":
      return {
        ...state,
        sortBy: action.payload,
      };
    case "SELECT_PRICE":
      return {
        ...state,
        price: action.payload,
      };

    case "SELECT_PREMIUM_FEAT":
      return {
        ...state,
        premiumFeat: state.premiumFeat.includes(action.payload)
          ? state.premiumFeat.filter((item) => item !== action.payload)
          : [...state.premiumFeat, action.payload],
      };

    case "CLEAR_DETAIL_FILTER":
      return {
        ...state,
        price: "ALL",
        premiumFeat: [],
      };
    default:
      return state;
  }
}

export const [ProductFilterProvider, useProductFilter] = createStateContext(
  (init: ProductFilterState) => useReducer(filterReducer, init),
);

export { initialFilterState };
