import { NextRequest } from "next/server";
import { APIRouteResponse, routeSuccess, routeError } from "@/server/boundary";
import { getAllProductsService } from "@/server/services";
import { ProductResponse } from "@/shared/schemas";
export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<ProductResponse[]>> => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const products = await getAllProductsService(category);

    return routeSuccess(products);
  } catch (error) {
    return routeError(error);
  }
};
