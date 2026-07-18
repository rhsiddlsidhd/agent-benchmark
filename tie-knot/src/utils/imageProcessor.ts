/**
 * 이미지 업로드 + 기존 URL 병합 범용 함수
 */
export async function processImages(
  uploadFn: (files: File[], onProgress?: (progress: number) => void) => Promise<string[] | undefined>,
  existing: string[],
  newFiles: File[],
  onProgress?: (progress: number) => void,
): Promise<string[]> {
  if (newFiles.length === 0) {
    onProgress?.(100);
    return existing;
  }

  const uploadedUrls = await uploadFn(newFiles, onProgress);
  return [...existing, ...(uploadedUrls ?? [])];
}
