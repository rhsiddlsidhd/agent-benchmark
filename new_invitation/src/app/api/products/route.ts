import { NextRequest } from "next/server";
import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { getAllProductsService, Product } from "@/services/product.service";

export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<Product[]>> => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const products = await getAllProductsService(category);

    return apiSuccess(products);
  } catch (error) {
    return handleRouteError(error);
  }
};
