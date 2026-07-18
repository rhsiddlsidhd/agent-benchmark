export interface ImageListPayload {
  existing: string[];
  newFiles: File[];
}

export interface ImagePayload {
  thumbnailImages: ImageListPayload;
  galleryImages: ImageListPayload;
}
