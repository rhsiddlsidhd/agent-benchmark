import { HTTPError } from "@/types/error";
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
    throw new HTTPError("이미지 업로드에 실패했습니다.", 500);
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

// Presigned URL 방식으로 업로드
async function uploadWithSignature(
  files: File[],
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<string[]> {
  // 1. 서명 요청
  const signatureRes = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  console.log("서명요청", { signatureRes });

  if (!signatureRes.ok) {
    const error = await signatureRes.json();
    throw new HTTPError(error.error || "서명 요청 실패", signatureRes.status);
  }

  const { signature, timestamp, cloudName, apiKey, allowed_formats } =
    await signatureRes.json();

  // 2. 각 파일 업로드
  let completed = 0;
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp);
    formData.append("allowed_formats", allowed_formats);
    formData.append("api_key", apiKey);
    formData.append("folder", folder);

    const res = await fetch(`${BASE_URL}/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new HTTPError(`업로드 실패: ${file.name}`, res.status);
    }

    const data = await res.json();

    // 진행률 업데이트
    completed++;
    if (onProgress) {
      onProgress(Math.round((completed / files.length) * 100));
    }

    return data.secure_url;
  });

  return await Promise.all(uploadPromises);
}

export async function uploadMainThumbnail(
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<string[] | undefined> {
  try {
    return await uploadWithSignature(files, "thumbnailImg", onProgress);
  } catch {
    return undefined;
  }
}

export async function uploadGalleryImages(
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<string[] | undefined> {
  try {
    return await uploadWithSignature(files, "galleryImg", onProgress);
  } catch (error) {
    console.error("uploadGalleryImages:", error);
    return undefined;
  }
}
