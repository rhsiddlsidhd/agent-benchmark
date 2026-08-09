export const revalidate = 600;

import { getAllProductsService, verifySession } from "@/server/services";
import { AdminProductsTemplate } from "./_components";

export default async function ProductsPage() {
  await verifySession("ADMIN");

  const products = await getAllProductsService();

  return <AdminProductsTemplate products={products} />;
}
