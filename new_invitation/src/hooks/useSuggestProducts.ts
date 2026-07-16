import { useMemo } from "react";
import { Product } from "@/services/product.service";

const useSuggestProducts = ({
  data,
  keyword,
}: {
  data: Product[];
  keyword: string;
}) => {
  const suggestions = useMemo(() => {
    if (!keyword) return [];

    return data
      .filter((item) => item.title.includes(keyword))
      .map((item) => item.title)
      .slice(0, 5);
  }, [data, keyword]);

  return { suggestions };
};

export default useSuggestProducts;
