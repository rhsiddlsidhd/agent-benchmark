import { NextRequest } from "next/server";
import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { getAllProductsService, Product } from "@/services";
export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<Product[]>> => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const products = await getAllProductsService(category);

    return apiOk(products);
  } catch (error) {
    return apiFail(error);
  }
};
