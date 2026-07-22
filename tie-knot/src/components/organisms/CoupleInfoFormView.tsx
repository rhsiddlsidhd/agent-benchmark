import { BasicInfoSection } from "./BasicInfoSection";
import { CoupleInfoSection } from "./CoupleInfoSection";
import { ParentsInfoSection } from "./ParentsInfoSection";
import { ImagesSection } from "./ImagesSection";
import { BottomActionBar } from "./BottomActionBar";
import { Progress } from "../atoms/progress";
import { Skeleton } from "../atoms/skeleton";
import { Save } from "lucide-react";
import type { useCoupleInfoForm } from "@/hooks";

type CoupleInfoFormViewProps = ReturnType<typeof useCoupleInfoForm> & {
  type: "create" | "edit";
};

export function CoupleInfoFormView({
  type,
  data,
  isLoading,
  banks,
  thumbnail,
  gallery,
  isUploading,
  uploadProgress,
  handleSubmit,
  coupleInfoId,
}: CoupleInfoFormViewProps) {
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
      <CoupleInfoSection data={data} banks={banks} />
      <ParentsInfoSection data={data} banks={banks} />
      <ImagesSection thumbnail={thumbnail} gallery={gallery} />

      {isUploading && <Progress value={uploadProgress} />}

      <BottomActionBar>
        <Save className="mr-2 aspect-square w-5" />
        저장하기
      </BottomActionBar>
    </form>
  );
}
