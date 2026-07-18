import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";

/**
 * data
 * items: {bank:string, name:{ko:string}} [ ]
 */

type BankName = {
  ko: string;
};

export type Banks = {
  bank: string;
  name: BankName;
}[];

export const GET = async (): Promise<APIRouteResponse<Banks>> => {
  try {
    const res = await fetch("https://api.portone.io/banks");
    const data: Banks = await res.json();
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
};
