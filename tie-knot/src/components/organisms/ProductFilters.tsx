"use client";

import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import AutoCompleteList from "@/components/molecules/AutoCompleteList";
import { Command, CommandInput } from "@/components/atoms/command";
import { Button } from "@/components/atoms/button";
import useSuggestProducts from "@/hooks/useSuggestProducts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { Badge } from "@/components/atoms/badge";
import { useState } from "react";

import { useProductFilter } from "@/context/productFilter/reducer";
import { Product } from "@/services/product.service";
import {
  SubCategory,
  ProductCategory,
  getSubCategoryOptions,
} from "@/utils/category";
import usePremiumFeature from "@/hooks/usePremiumFeatures";

import {
  PRODUCT_SORT_OPTIONS,
  PRODUCT_PRICE_OPTIONS,
  PREMIUM_FEATURE_LABELS,
  PRODUCT_SORT_KEYS,
  PRODUCT_PRICE_KEYS,
  ProductSortType,
} from "@/constants/product";
import { TypographyMuted, TypographySmall } from "@/components/atoms/typoqraphy";

export function ProductFilters({
  data,
  category,
}: {
  data: Product[];
  category: ProductCategory;
}) {
  const [state, dispatch] = useProductFilter();
  const { premiumFeatures } = usePremiumFeature();
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const { suggestions } = useSuggestProducts({
    data,
    keyword: state.keyword.trim(),
  });

  const prices = PRODUCT_PRICE_KEYS;
  const sortBy = PRODUCT_SORT_KEYS;

  return (
    <div className="mb-8 space-y-4">
      <Command
        shouldFilter={false}
        className="relative max-w-md overflow-visible rounded-lg border shadow-md"
      >
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

        <CommandInput
          value={state.keyword}
          placeholder="상품 검색..."
          onValueChange={(value) => {
            dispatch({ type: "CHANGE_KEYWORD", payload: value });
            dispatch({ type: "OPEN_SUGGESTIONS" });
          }}
        />

        <AutoCompleteList
          suggestions={suggestions}
          isOpen={state.isOpen}
          onSelect={(name) => {
            dispatch({ type: "CHANGE_KEYWORD", payload: name });
            dispatch({ type: "CLOSE_SUGGESTIONS" });
          }}
        />
      </Command>

      <TypographyMuted className="mt-1 text-gray-500">
        원하는 스타일과 기준을 선택해보세요
      </TypographyMuted>

      <div className="flex flex-wrap gap-2">
        {getSubCategoryOptions(category, true).map((option) => (
          <Button
            key={option.value}
            variant={state.subCategory === option.value ? "default" : "outline"}
            onClick={() =>
              dispatch({
                type: "SELECT_SUB_CATEGORY",
                payload: option.value as SubCategory | "all",
              })
            }
            size="sm"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-w-35 justify-between bg-transparent"
            >
              <span className="flex items-center gap-2">
                {PRODUCT_SORT_OPTIONS[state.sortBy]}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuRadioGroup
              onValueChange={(value) =>
                dispatch({
                  type: "SELECT_SORT_BY",
                  payload: value as ProductSortType,
                })
              }
            >
              {sortBy.map((value) => (
                <DropdownMenuRadioItem value={value} key={value}>
                  {PRODUCT_SORT_OPTIONS[value]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-full min-w-35 gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          상세 필터
        </Button>
      </div>

      {showAdvanced && (
        <div className="border-border bg-muted/30 space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <TypographySmall className="font-medium">가격대</TypographySmall>
            <div className="flex flex-wrap gap-2">
              {prices.map((value) => (
                <Badge
                  variant={state.price === value ? "default" : "outline"}
                  key={value}
                  onClick={() =>
                    dispatch({ type: "SELECT_PRICE", payload: value })
                  }
                  className="cursor-pointer"
                >
                  {PRODUCT_PRICE_OPTIONS[value]}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <TypographySmall className="font-medium">특별 옵션</TypographySmall>
            <div className="flex flex-wrap gap-2">
              {premiumFeatures.map((value) => (
                <Badge
                  variant={
                    state.premiumFeat.includes(value._id)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  key={value._id}
                  onClick={() =>
                    dispatch({
                      type: "SELECT_PREMIUM_FEAT",
                      payload: value._id,
                    })
                  }
                >
                  {PREMIUM_FEATURE_LABELS[
                    value.code as keyof typeof PREMIUM_FEATURE_LABELS
                  ] || value.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="cursor-pointer"
              variant="outline"
              size="sm"
              onClick={() =>
                dispatch({ type: "CLEAR_DETAIL_FILTER", payload: null })
              }
            >
              필터 초기화
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
