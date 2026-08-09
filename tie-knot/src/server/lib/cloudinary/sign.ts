import { v2 as cloudinary } from "cloudinary";

export type UploadSignature = {
  signature: string;
  timestamp: number;
  folder: string;
  allowed_formats: string;
  cloudName: string | undefined;
  apiKey: string | undefined;
};

export function signUploadRequest(folder: string): UploadSignature {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
    allowed_formats: "jpg,png,webp,jpeg",
  };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    ...paramsToSign,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}
