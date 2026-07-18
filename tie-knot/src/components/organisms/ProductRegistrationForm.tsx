"use client";

import type React from "react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { createProductAction } from "@/actions/createProductAction";
import type { PremiumFeature } from "@/services/premiumFeature.service";
import Alert from "@/components/molecules/Alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { Textarea } from "@/components/atoms/textarea";
import SelectField from "@/components/organisms/fields/SelectField";
import { Switch } from "@/components/atoms/switch";
import { Checkbox } from "@/components/atoms/checkbox";
import { Label } from "@/components/atoms/label";
import { getCategoryOptions, getSubCategoryOptions, ProductCategory } from "@/utils/category";
import { getFieldError } from "@/utils/error";
import { APIResponse } from "@/types/error";
import { TypographyMuted, TypographyH4 } from "@/components/atoms/typoqraphy";

interface ProductRegistrationFormProps {
  premiumFeatures: PremiumFeature[];
}

export function ProductRegistrationForm({
  premiumFeatures,
}: ProductRegistrationFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(createProductAction, null);

  const [isPremium, setIsPremium] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("invitation");
  const [isFeature, setIsFeature] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewPreview, setPreviewPreview] = useState<string | null>(null);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<"rate" | "amount">("rate");

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.data.message);
      router.push("/admin/products");
    }
  }, [state, router]);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnail(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
    setThumbnailFile(null);
    const input = document.getElementById("thumbnail-input") as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleRemovePreview = () => {
    setPreviewFile(null);
    setPreviewPreview(null);
    const input = document.getElementById("preview-input") as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleFeatureChange = (checked: boolean, id: string) => {
    setSelectedFeatureIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const titleError = getFieldError(state, "title");
  const descriptionError = getFieldError(state, "description");
  const categoryError = getFieldError(state, "category");
  const subCategoryError = getFieldError(state, "subCategory");
  const priceError = getFieldError(state, "price");
  const priorityError = getFieldError(state, "priority");
  const thumbnailError = getFieldError(state, "thumbnail");
  const featureIdsError = getFieldError(state, "featureIds");

  return (
    <form action={action} className="space-y-6">
      {/* featureIds — 선택된 것만 전송 */}
      {selectedFeatureIds.map((id) => (
        <input key={id} type="hidden" name="featureIds" value={id} />
      ))}
      <input type="hidden" name="isFeatured" value={isFeature.toString()} />
      <input type="hidden" name="isPremium" value={isPremium.toString()} />
      <input type="hidden" name="discount.discountType" value={discountType} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-2">

          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>상품의 이름, 설명, 분류 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">상품명 *</Label>
                <Input id="title" name="title" placeholder="예: 엘레강트 로즈 청첩장" required />
                {titleError && <Alert type="error">{titleError}</Alert>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">상품 설명 *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="상품에 대한 자세한 설명을 입력하세요."
                  rows={4}
                  required
                />
                {descriptionError && <Alert type="error">{descriptionError}</Alert>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  id="category"
                  name="category"
                  defaultValue={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as ProductCategory)}
                  placeholder="카테고리를 선택하세요"
                  data={getCategoryOptions()}
                  error={categoryError}
                  required
                >
                  카테고리(대분류)
                </SelectField>

                <SelectField
                  id="subCategory"
                  name="subCategory"
                  placeholder="서브 카테고리를 선택하세요"
                  data={getSubCategoryOptions(selectedCategory)}
                  error={subCategoryError}
                  required
                >
                  서브 카테고리
                </SelectField>
              </div>
            </CardContent>
          </Card>

          {/* 가격 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>가격 정보</CardTitle>
              <CardDescription>상품의 가격 및 할인, 프리미엄 옵션을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">기본 가격 *</Label>
                  <div className="relative">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="1000"
                      required
                      className="pr-12"
                    />
                    <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">원</span>
                  </div>
                  {priceError && <Alert type="error">{priceError}</Alert>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">할인</Label>
                  <div className="flex gap-2">
                    <SelectField
                      id="discountType"
                      name="discount.discountType"
                      defaultValue={discountType}
                      onValueChange={(v) => setDiscountType(v as "rate" | "amount")}
                      placeholder=""
                      data={[
                        { value: "rate", label: "비율 (%)" },
                        { value: "amount", label: "금액 (원)" },
                      ]}
                    >
                      {""}
                    </SelectField>
                    <div className="relative flex-1">
                      <Input
                        id="discountValue"
                        name="discount.value"
                        type="number"
                        placeholder="0"
                        min="0"
                        step={discountType === "rate" ? "0.01" : "1000"}
                        max={discountType === "rate" ? "1" : undefined}
                        defaultValue="0"
                        className="pr-12"
                      />
                      <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                        {discountType === "rate" ? "율" : "원"}
                      </span>
                    </div>
                  </div>
                  <TypographyMuted>
                    {discountType === "rate" ? "0~1 사이 소수 입력 (예: 0.1 = 10% 할인)" : "차감 금액 입력"}
                  </TypographyMuted>
                </div>
              </div>

              <div className="border-border flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isPremium" className="text-base">프리미엄 상품</Label>
                  <TypographyMuted>추가 유료 옵션을 제공하는 상품입니다.</TypographyMuted>
                </div>
                <Switch
                  id="isPremium"
                  checked={isPremium}
                  onCheckedChange={(checked) => {
                    setIsPremium(checked);
                    if (!checked) setSelectedFeatureIds([]);
                  }}
                />
              </div>

              {isPremium && (
                <div className="space-y-4 rounded-lg border border-dashed p-4">
                  <TypographyH4 className="text-foreground font-medium">프리미엄 기능 선택</TypographyH4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {premiumFeatures.map((feature) => (
                      <div key={feature.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature.code}`}
                          checked={selectedFeatureIds.includes(feature._id)}
                          onCheckedChange={(checked) =>
                            handleFeatureChange(!!checked, feature._id)
                          }
                        />
                        <Label
                          htmlFor={`feature-${feature.code}`}
                          className="cursor-pointer text-sm leading-none font-medium"
                        >
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {featureIdsError && <Alert type="error">{featureIdsError}</Alert>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 노출 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>노출 설정</CardTitle>
              <CardDescription>상품 노출 및 정렬 순서를 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-border flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isFeatured" className="text-base">추천 상품</Label>
                  <TypographyMuted>메인 페이지에 추천 상품으로 노출됩니다.</TypographyMuted>
                </div>
                <Switch id="isFeatured" checked={isFeature} onCheckedChange={setIsFeature} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">추천 우선순위</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                  defaultValue="0"
                />
                {priorityError && <Alert type="error">{priorityError}</Alert>}
                <TypographyMuted>높은 숫자일수록 상단에 노출됩니다 (0-100)</TypographyMuted>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8 lg:col-span-1">

          {/* 썸네일 */}
          <Card>
            <CardHeader>
              <CardTitle>썸네일 이미지 *</CardTitle>
              <CardDescription>상품 목록에 표시될 대표 이미지입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {thumbnail ? (
                  <div className="border-border relative aspect-video w-full overflow-hidden rounded-lg border">
                    <Image src={thumbnail} alt="Thumbnail" fill className="object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={handleRemoveThumbnail}
                      className="absolute top-2 right-2 h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="thumbnail-input"
                    className="border-border bg-accent/20 hover:bg-accent/40 flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                  >
                    <UploadCloud className="text-muted-foreground mb-2 h-8 w-8" />
                    <TypographyMuted className="mb-1">클릭하여 이미지 업로드</TypographyMuted>
                    <TypographyMuted>PNG, JPG, WEBP (최대 5MB)</TypographyMuted>
                  </label>
                )}
                <input id="thumbnail-input" type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                <input
                  type="file"
                  name="thumbnail"
                  className="hidden"
                  ref={(input) => {
                    if (input && thumbnailFile) {
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(thumbnailFile);
                      input.files = dataTransfer.files;
                    }
                  }}
                />
                {thumbnailError && <Alert type="error">{thumbnailError}</Alert>}
              </div>
            </CardContent>
          </Card>

          {/* 미리보기 URL */}
          <Card>
            <CardHeader>
              <CardTitle>미리보기 이미지</CardTitle>
              <CardDescription>상품 상세 페이지에 표시될 미리보기 이미지입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {previewPreview ? (
                  <div className="border-border relative aspect-video w-full overflow-hidden rounded-lg border">
                    <Image src={previewPreview} alt="Preview" fill className="object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={handleRemovePreview}
                      className="absolute top-2 right-2 h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="preview-input"
                    className="border-border bg-accent/20 hover:bg-accent/40 flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                  >
                    <UploadCloud className="text-muted-foreground mb-2 h-8 w-8" />
                    <TypographyMuted className="mb-1">클릭하여 이미지 업로드</TypographyMuted>
                    <TypographyMuted>선택사항</TypographyMuted>
                  </label>
                )}
                <input id="preview-input" type="file" className="hidden" accept="image/*" onChange={handlePreviewUpload} />
                <input
                  type="file"
                  name="previewUrl"
                  className="hidden"
                  ref={(input) => {
                    if (input && previewFile) {
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(previewFile);
                      input.files = dataTransfer.files;
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          취소
        </Button>
        <Button type="submit" className="min-w-30" disabled={pending}>
          {pending ? "등록 중..." : "상품 등록"}
        </Button>
      </div>
    </form>
  );
}
