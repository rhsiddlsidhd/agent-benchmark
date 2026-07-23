export const STATUS_ITEMS = [
  { value: "active", label: "판매중" },
  { value: "inactive", label: "비활성" },
  { value: "soldOut", label: "품절" },
] as const;

type Status = (typeof STATUS_ITEMS)[number]["value"];
export const isStatus = (value: string): value is Status =>
  STATUS_ITEMS.some((item) => item.value === value);
