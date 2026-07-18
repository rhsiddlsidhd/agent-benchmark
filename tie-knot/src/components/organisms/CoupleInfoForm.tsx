"use client";

import { BasicInfoSection } from "./BasicInfoSection";
import { CoupleInfoSection } from "./CoupleInfoSection";
import { ParentsInfoSection } from "./ParentsInfoSection";
import { ImagesSection } from "./ImagesSection";
import { startTransition, useActionState, useEffect } from "react";
import { createCoupleInfoAction } from "@/actions/createCoupleInfoAction";
import { useRouter, useSearchParams } from "next/navigation";
import BottomActionBar from "./BottomActionBar";
import { updateCoupleInfoAction } from "@/actions/updateCoupleInfoAction";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useImageList } from "@/hooks/useImageList";
import useFetchCoupleInfo from "@/hooks/useFetchCoupleInfo";
import { Progress } from "../atoms/progress";
import { Skeleton } from "../atoms/skeleton";
import { APIResponse } from "@/types/error";
import { Save } from "lucide-react";

export function CoupleInfoForm({ type }: { type: "create" | "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coupleInfoId = searchParams.get("q");

  const currentAction =
    type === "edit" ? updateCoupleInfoAction : createCoupleInfoAction;
  const [state, action] = useActionState<
    APIResponse<Record<string, string>>,
    FormData
  >(currentAction, null);

  const { data, isLoading } = useFetchCoupleInfo();
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

    if (state && state.success === true && state.data._id)
      switch (type) {
        case "create":
          router.push(`/payment?q=${state.data._id}`);
          break;
        case "edit":
          toast.success(state.data.message);
          router.push(`/order`);
          break;
        default:
          break;
      }
  }, [state, router, type]);

  if (type === "edit" && isLoading)
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {type === "edit" && coupleInfoId && (
        <input type="hidden" name="couple_info_id" value={coupleInfoId} />
      )}

      <BasicInfoSection data={data} />
      <CoupleInfoSection data={data} />
      <ParentsInfoSection data={data} />
      <ImagesSection thumbnail={thumbnail} gallery={gallery} />

      {isUploading && <Progress value={uploadProgress} />}

      <BottomActionBar>
        <Save className="mr-2 aspect-square w-5" />
        저장하기
      </BottomActionBar>
    </form>
  );
}
