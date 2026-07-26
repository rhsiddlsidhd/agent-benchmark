import mongoose from "mongoose";
import { GuestbookType } from "@/shared/schemas";

export const buildGuestbookInput = (
  overrides?: Partial<GuestbookType>,
): GuestbookType => ({
  coupleInfoId: new mongoose.Types.ObjectId().toString(),
  author: "하객1",
  password: "1234",
  message: "결혼 축하드립니다!",
  isPrivate: false,
  ...overrides,
});
