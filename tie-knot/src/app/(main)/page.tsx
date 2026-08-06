export const revalidate = 3600;

import { HomeTemplate } from "./_components";
import {
  getFeaturedTemplatesService,
  getPopularProductsService,
  getProductService,
  Product,
} from "@/server/services";
import { POPULAR_PRODUCTS_LIMIT } from "@/shared/constants";

const page = async () => {
  const previewProductId = process.env.NEXT_PUBLIC_MAIN_PREVIEW_PRODUCT_ID;
  const infoId = process.env.NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID;

  const [product, invitation, popularProducts] = await Promise.all([
    previewProductId ? getProductService(previewProductId) : null,
    getFeaturedTemplatesService("invitation").catch(() => [] as Product[]),
    getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(() => [] as Product[]),
  ]);

  return (
    <HomeTemplate
      invitation={invitation}
      product={product}
      infoId={infoId}
      popularProducts={popularProducts}
    />
  );
};

export default page;
