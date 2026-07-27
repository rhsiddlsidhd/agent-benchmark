import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { validateAndFlattenMock, processImagesMock, uploadMainThumbnailMock, uploadGalleryImagesMock } =
  vi.hoisted(() => ({
    validateAndFlattenMock: vi.fn(),
    processImagesMock: vi.fn(),
    uploadMainThumbnailMock: vi.fn(),
    uploadGalleryImagesMock: vi.fn(),
  }));

vi.mock("@/shared/utils", () => ({
  validateAndFlatten: validateAndFlattenMock,
  processImages: processImagesMock,
}));
vi.mock("@/shared/schemas", () => ({ coupleInfoClientSchema: {} }));
vi.mock("@/client/lib/cloudinary", () => ({
  uploadMainThumbnail: uploadMainThumbnailMock,
  uploadGalleryImages: uploadGalleryImagesMock,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";
import { useImageUpload } from "./useImageUpload";

const buildPayload = () => ({
  thumbnailImages: { existing: [] as string[], newFiles: [] as File[] },
  galleryImages: { existing: [] as string[], newFiles: [] as File[] },
});

describe("useImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("검증 실패 시 null을 리턴하고 업로드를 호출하지 않는다", async () => {
    validateAndFlattenMock.mockReturnValue({ success: false });
    const { result } = renderHook(() => useImageUpload());

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.upload(new FormData(), buildPayload());
    });

    expect(uploadResult).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("입력값을 확인해주세요");
    expect(processImagesMock).not.toHaveBeenCalled();
  });

  it("검증 성공 시 썸네일/갤러리 업로드 함수로 processImages를 호출한다", async () => {
    validateAndFlattenMock.mockReturnValue({
      success: true,
      data: {
        thumbnailImages: { existing: [], newFiles: [] },
        galleryImages: { existing: [], newFiles: [] },
      },
    });
    processImagesMock
      .mockImplementationOnce(async (_fn, _existing, _newFiles, onProgress) => {
        onProgress(50);
        return ["thumb.jpg"];
      })
      .mockImplementationOnce(async (_fn, _existing, _newFiles, onProgress) => {
        onProgress(50);
        return ["gallery.jpg"];
      });

    const { result } = renderHook(() => useImageUpload());

    const formData = new FormData();
    formData.set("groom_parents_father_name", "아버지");
    formData.set("groom_parents_father_phone", "010-0000-0000");

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.upload(formData, buildPayload());
    });

    expect(uploadResult).toEqual({
      thumbnailUrls: ["thumb.jpg"],
      galleryUrls: ["gallery.jpg"],
    });
    expect(processImagesMock).toHaveBeenNthCalledWith(
      1,
      uploadMainThumbnailMock,
      [],
      [],
      expect.any(Function),
    );
    expect(processImagesMock).toHaveBeenNthCalledWith(
      2,
      uploadGalleryImagesMock,
      [],
      [],
      expect.any(Function),
    );
  });

  it("업로드 중 예외가 발생하면 null을 리턴하고 에러 토스트를 띄운다", async () => {
    validateAndFlattenMock.mockReturnValue({
      success: true,
      data: {
        thumbnailImages: { existing: [], newFiles: [] },
        galleryImages: { existing: [], newFiles: [] },
      },
    });
    processImagesMock.mockRejectedValueOnce(new Error("업로드 실패"));

    const { result } = renderHook(() => useImageUpload());

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.upload(new FormData(), buildPayload());
    });

    expect(uploadResult).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("이미지 업로드에 실패했습니다");
  });
});
