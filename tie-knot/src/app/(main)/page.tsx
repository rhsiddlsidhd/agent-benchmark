export const revalidate = 3600;

import { HomeTemplate } from "./_components";
import { getFeaturedTemplatesService, getProductService, Product } from "@/server/services";

const page = async () => {
  const previewProductId = process.env.NEXT_PUBLIC_MAIN_PREVIEW_PRODUCT_ID;
  const infoId = process.env.NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID;

  const [product, invitation] = await Promise.all([
    previewProductId ? getProductService(previewProductId) : null,
    getFeaturedTemplatesService("invitation").catch(() => [] as Product[]),
  ]);

  return <HomeTemplate invitation={invitation} product={product} infoId={infoId} />;
};

export default page;
