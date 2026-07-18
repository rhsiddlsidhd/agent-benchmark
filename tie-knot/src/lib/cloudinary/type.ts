export type CloudinaryResource = {
  asset_folder: string;
  asset_id: string;
  bytes: number;
  created_at: string;
  display_name: string;
  etag: string;
  format: string;
  height: number;
  original_filename: string;
  placeholder: boolean;
  public_id: string;
  resource_type: "image" | "video" | "raw"; // 리소스 유형
  secure_url: string; // 주로 이 URL을 사용하게 됩니다 (HTTPS)
  signature: string;
  tags: string[];
  type: string;
  url: string; // HTTP 주소
  version: number;
  version_id: string;
  width: number;
};
