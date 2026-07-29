import { describe, it, expect } from "vitest";
import { updateCoupleInfo } from "./updateCoupleInfo";

describe("updateCoupleInfo", () => {
  it("couple_info_id가 없으면 VALIDATION을 리턴한다", async () => {
    const result = await updateCoupleInfo(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "잘못된 접근입니다." },
    });
  });
});
