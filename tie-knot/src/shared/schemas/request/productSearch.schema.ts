import * as z from "zod";

// 빈 문자열/공백만 입력은 "조건 없음"과 동일하게 다뤄야 한다.
// trim 후 빈 문자열이면 undefined로 정규화해서, 서비스가 조건 유무만 보고 분기할 수 있게 한다.
const searchTermSchema = z
  .string()
  .trim()
  .max(100, { message: "검색어는 100자 이하로 입력해주세요." })
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const productSearchRequestSchema = z.object({
  q: searchTermSchema,
});

export type ProductSearchRequest = z.infer<typeof productSearchRequestSchema>;
