import { v2 as cloudinary } from "cloudinary";
import { AppError } from "@/shared/types";

export async function deleteProductAsset(publicId: string): Promise<void> {
  if (!publicId) return;
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
  if (!result || !["ok", "not found"].includes(result.result)) {
    throw new AppError("EXTERNAL_SERVICE", `이미지 정리에 실패했습니다: ${publicId}`);
  }
}
