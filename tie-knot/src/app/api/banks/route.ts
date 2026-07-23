import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
import { BanksResponse } from "@/shared/schemas";

export const GET = async (): Promise<APIRouteResponse<BanksResponse>> => {
  try {
    const res = await fetch("https://api.portone.io/banks");
    const { items }: { items: BanksResponse } = await res.json();
    return apiOk(items);
  } catch (error) {
    return apiFail(error);
  }
};
