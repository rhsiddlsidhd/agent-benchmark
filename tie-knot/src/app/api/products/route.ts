import { NextRequest } from "next/server";
import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
import { getAllProductsService } from "@/server/services";
import { ProductResponse } from "@/shared/schemas";
export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<ProductResponse[]>> => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const products = await getAllProductsService(category);

    return apiOk(products);
  } catch (error) {
    return apiFail(error);
  }
};
