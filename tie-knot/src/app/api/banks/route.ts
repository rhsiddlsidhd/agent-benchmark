import { APIRouteResponse, routeSuccess, routeError } from "@/server/boundary";
import { BanksResponse } from "@/shared/schemas";

export const GET = async (): Promise<APIRouteResponse<BanksResponse>> => {
  try {
    const res = await fetch("https://api.portone.io/banks");
    const { items }: { items: BanksResponse } = await res.json();
    return routeSuccess(items);
  } catch (error) {
    return routeError(error);
  }
};
