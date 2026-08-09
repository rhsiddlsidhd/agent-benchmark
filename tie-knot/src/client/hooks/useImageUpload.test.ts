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

const buildFullFormData = () => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    groom_name: "홍길동",
    groom_phone: "010-1111-2222",
    groom_bank_name: "국민은행",
    groom_account_number: "111-222",
    groom_parents_father_name: "홍아버지",
    groom_parents_father_phone: "010-1000-1000",
    groom_parents_father_bank_name: "신한은행",
    groom_parents_father_account_number: "333-444",
    groom_parents_mother_name: "홍어머니",
    groom_parents_mother_phone: "010-2000-2000",
    bride_name: "김철수",
    bride_phone: "010-3333-4444",
    bride_bank_name: "우리은행",
    bride_account_number: "555-666",
    wedding_date: "2026-10-10",
    wedding_time: "13:00",
    venue_name: "더채플앳청담",
    venue_address: "서울 강남구",
    venue_address_detail: "3층",
    subway_station: "강남역",
    guestbook_enabled: "on",
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

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

  it("FormData 전체 필드를 검증 스키마 입력 shape으로 정확히 매핑한다", async () => {
    validateAndFlattenMock.mockReturnValue({ success: false });
    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await result.current.upload(buildFullFormData(), buildPayload());
    });

    expect(validateAndFlattenMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        groom: {
          name: "홍길동",
          phone: "010-1111-2222",
          bankName: "국민은행",
          accountNumber: "111-222",
          father: {
            name: "홍아버지",
            phone: "010-1000-1000",
            bankName: "신한은행",
            accountNumber: "333-444",
          },
          mother: {
            name: "홍어머니",
            phone: "010-2000-2000",
            bankName: "",
            accountNumber: "",
          },
        },
        bride: {
          name: "김철수",
          phone: "010-3333-4444",
          bankName: "우리은행",
          accountNumber: "555-666",
          father: undefined,
          mother: undefined,
        },
        weddingDate: "2026-10-10",
        weddingTime: "13:00",
        venue: "더채플앳청담",
        address: "서울 강남구",
        addressDetail: "3층",
        subwayStation: "강남역",
        guestbookEnabled: true,
      }),
    );
  });

  it("빈 FormData는 각 필드를 빈 문자열로, 부모 정보는 undefined로, subwayStation은 undefined로, guestbookEnabled는 false로 매핑한다", async () => {
    validateAndFlattenMock.mockReturnValue({ success: false });
    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await result.current.upload(new FormData(), buildPayload());
    });

    expect(validateAndFlattenMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        groom: {
          name: "",
          phone: "",
          bankName: "",
          accountNumber: "",
          father: undefined,
          mother: undefined,
        },
        subwayStation: undefined,
        guestbookEnabled: false,
      }),
    );
  });

  it("이미지 payload(thumbnailImages/galleryImages)를 검증 데이터에 그대로 포함한다", async () => {
    validateAndFlattenMock.mockReturnValue({ success: false });
    const { result } = renderHook(() => useImageUpload());
    const payload = {
      thumbnailImages: { existing: ["a.jpg"], newFiles: [] as File[] },
      galleryImages: { existing: ["b.jpg"], newFiles: [] as File[] },
    };

    await act(async () => {
      await result.current.upload(new FormData(), payload);
    });

    expect(validateAndFlattenMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        thumbnailImages: payload.thumbnailImages,
        galleryImages: payload.galleryImages,
      }),
    );
  });

  it("검증 성공 시 썸네일/갤러리 업로드 함수로 processImages를 순서대로 호출한다", async () => {
    validateAndFlattenMock.mockReturnValue({
      success: true,
      data: {
        thumbnailImages: { existing: ["existing-thumb"], newFiles: [] },
        galleryImages: { existing: ["existing-gallery"], newFiles: [] },
      },
    });
    processImagesMock
      .mockResolvedValueOnce(["thumb.jpg"])
      .mockResolvedValueOnce(["gallery.jpg"]);

    const { result } = renderHook(() => useImageUpload());

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.upload(new FormData(), buildPayload());
    });

    expect(uploadResult).toEqual({
      thumbnailUrls: ["thumb.jpg"],
      galleryUrls: ["gallery.jpg"],
    });
    expect(processImagesMock).toHaveBeenNthCalledWith(
      1,
      uploadMainThumbnailMock,
      ["existing-thumb"],
      [],
      expect.any(Function),
    );
    expect(processImagesMock).toHaveBeenNthCalledWith(
      2,
      uploadGalleryImagesMock,
      ["existing-gallery"],
      [],
      expect.any(Function),
    );
  });

  it("업로드 진행률을 썸네일 0~50%, 갤러리 50~100% 구간으로 계산한다", async () => {
    validateAndFlattenMock.mockReturnValue({
      success: true,
      data: {
        thumbnailImages: { existing: [], newFiles: [] },
        galleryImages: { existing: [], newFiles: [] },
      },
    });

    let thumbnailOnProgress: ((progress: number) => void) | undefined;
    let galleryOnProgress: ((progress: number) => void) | undefined;
    processImagesMock
      .mockImplementationOnce(async (_fn, _existing, _newFiles, onProgress) => {
        thumbnailOnProgress = onProgress;
        return ["thumb.jpg"];
      })
      .mockImplementationOnce(async (_fn, _existing, _newFiles, onProgress) => {
        galleryOnProgress = onProgress;
        return ["gallery.jpg"];
      });

    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await result.current.upload(new FormData(), buildPayload());
    });

    act(() => thumbnailOnProgress?.(80));
    expect(result.current.uploadProgress).toBe(40);

    act(() => galleryOnProgress?.(60));
    expect(result.current.uploadProgress).toBe(80);
  });

  it("정상 완료 후 진행률은 100, isUploading은 false다", async () => {
    validateAndFlattenMock.mockReturnValue({
      success: true,
      data: {
        thumbnailImages: { existing: [], newFiles: [] },
        galleryImages: { existing: [], newFiles: [] },
      },
    });
    processImagesMock.mockResolvedValue([]);

    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await result.current.upload(new FormData(), buildPayload());
    });

    expect(result.current.uploadProgress).toBe(100);
    expect(result.current.isUploading).toBe(false);
  });

  it("업로드 중에는 isUploading이 true다", async () => {
    validateAndFlattenMock.mockReturnValue({
      success: true,
      data: {
        thumbnailImages: { existing: [], newFiles: [] },
        galleryImages: { existing: [], newFiles: [] },
      },
    });
    processImagesMock.mockResolvedValue([]);

    const { result } = renderHook(() => useImageUpload());

    let uploadPromise: Promise<unknown>;
    act(() => {
      uploadPromise = result.current.upload(new FormData(), buildPayload());
    });

    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      await uploadPromise;
    });

    expect(result.current.isUploading).toBe(false);
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
    expect(result.current.isUploading).toBe(false);
  });
});
