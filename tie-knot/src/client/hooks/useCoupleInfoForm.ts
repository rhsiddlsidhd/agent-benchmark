"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { createCoupleInfo, updateCoupleInfo } from "@/server/actions";

import { APIResponse } from "@/shared/types";
import { useImageUpload } from "./useImageUpload";
import { useImageList } from "./useImageList";
import { useFetchCoupleInfo } from "./useFetchCoupleInfo";
import { useBanks } from "./useBanks";
import { useSubwayStations } from "./useSubwayStations";
import { routes } from "@/shared/constants";

export function useCoupleInfoForm({ type }: { type: "create" | "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coupleInfoId = searchParams.get("q");
  const orderId = searchParams.get("orderId");

  const currentAction =
    type === "edit" ? updateCoupleInfo : createCoupleInfo;
  const [state, action] = useActionState<
    APIResponse<Record<string, string>>,
    FormData
  >(currentAction, null);

  const { data, isLoading } = useFetchCoupleInfo();
  const { banks } = useBanks();
  const { subwayStations } = useSubwayStations();
  const thumbnail = useImageList(data?.thumbnailImages);
  const gallery = useImageList(data?.galleryImages);

  const { upload, uploadProgress, isUploading } = useImageUpload();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const imagePayload = {
      thumbnailImages: thumbnail.getPayload(),
      galleryImages: gallery.getPayload(),
    };

    const result = await upload(formData, imagePayload);
    if (!result) return;

    formData.set("thumbnailSource", JSON.stringify(result.thumbnailUrls));
    formData.set("gallerySource", JSON.stringify(result.galleryUrls));

    startTransition(() => action(formData));
  };

  useEffect(() => {
    if (!state) return;

    // 결제 이후 my-orders 흐름에서 채워지는 콘텐츠라, create/edit 모두 완료 후
    // my-orders로 돌아간다(payment로 다시 보내지 않는다 — TODO.md "couple-info를
    // payment 이후로 분리" 참고).
    if (state && state.success === true && state.data._id) {
      toast.success(state.data.message);
      router.push(routes.myOrders.root);
    }
  }, [state, router]);

  return {
    data,
    isLoading,
    banks,
    subwayStations,
    thumbnail,
    gallery,
    isUploading,
    uploadProgress,
    handleSubmit,
    coupleInfoId,
    orderId,
  };
}
