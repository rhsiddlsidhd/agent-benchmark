import { AppError } from "@/shared/types";

const BASE_URL = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL;

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

  const signatureJson = await signatureRes.json();

  if (!signatureRes.ok || !signatureJson.success) {
    throw new AppError(
      "INTERNAL",
      signatureJson.error?.message ?? "서명 요청 실패",
    );
  }

  const { signature, timestamp, cloudName, apiKey, allowed_formats } =
    signatureJson.data;

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
      throw new AppError("EXTERNAL_SERVICE", `업로드 실패: ${file.name}`);
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
