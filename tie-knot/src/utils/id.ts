export const generateUid = (type: "PAY" | "ORDER" | "PRODUCT"): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // 20240522
  const randomStr = Math.random().toString(36).substring(2, 8); // 6자리 랜덤 문자열

  return `${type}-${dateStr}-${randomStr}`;
};
