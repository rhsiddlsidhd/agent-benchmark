import { AppError } from "@/shared/types";
import { CloudinaryResource } from "./type";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const BASE_URL = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL;

const uploadToCloudinary = async <T>(file: File, folder: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", `${UPLOAD_PRESET}`);
  formData.append("folder", folder);
  const res = await fetch(`${BASE_URL}/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new AppError("EXTERNAL_SERVICE", "이미지 업로드에 실패했습니다.");
  }

  const data: T = await res.json();

  return data;
};

export async function uploadProductImage(
  file: File,
  type: "thumbnail" | "preview" = "thumbnail",
): Promise<string | undefined> {
  try {
    const folder =
      type === "thumbnail" ? "products/thumbnails" : "products/previews";
    const result = await uploadToCloudinary<CloudinaryResource>(file, folder);
    return result.secure_url;
  } catch (error) {
    console.error("uploadProductImage:", error);
    return undefined;
  }
}
