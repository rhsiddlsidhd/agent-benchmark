"use client";

import type React from "react";
import { useActionState, useEffect, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { updateProductAction } from "@/actions/updateProductAction";
import type { Product } from "@/services/product.service";
import Alert from "@/components/molecules/Alert";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { Textarea } from "@/components/atoms/textarea";
import SelectField from "@/components/organisms/fields/SelectField";
import { Switch } from "@/components/atoms/switch";
import { Checkbox } from "@/components/atoms/checkbox";
import { Label } from "@/components/atoms/label";
import usePremiumFeature from "@/hooks/usePremiumFeatures";
import Spinner from "@/components/molecules/Spinner";
import ProductThumbnail from "@/components/molecules/ProductThumbnail";
import { getCategoryOptions, getSubCategoryOptions, ProductCategory, SubCategory } from "@/utils/category";
import { toast } from "sonner";
import { useAdminModalStore } from "@/store/admin.modal.store";
import { TypographyH4, TypographyMuted } from "@/components/atoms/typoqraphy";

interface ProductEditDialogProps {
  product: Product;
}

export function ProductEditDialog({ product }: ProductEditDialogProps) {
  const [state, action, pending] = useActionState(
    updateProductAction.bind(null, product._id),
    null,
  );
  const closeModal = useAdminModalStore((state) => state.closeModal);
  const { premiumFeatures, loading } = usePremiumFeature();
  const [isPremium, setIsPremium] = useState(product.isPremium);
  const [isFeature, setIsFeature] = useState(product.isFeatured);
  const [thumbnail, setThumbnail] = useState<string | null>(product.thumbnail);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    product.featureIds || [],
  );
  const [status, setStatus] = useState(product.status);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(product.category as ProductCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | "">(product.subCategory as SubCategory);

  useEffect(() => {
    if (state && state.success) {
      toast.message(state.data.message);
      closeModal();
    }
  }, [state, closeModal]);

  useEffect(() => {
    if (!isPremium) {
      setSelectedFeatures([]);
    }
  }, [isPremium]);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnail(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(product.thumbnail);
    setThumbnailFile(null);
    const fileInput = document.getElementById(
      "edit-thumbnail-input",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleFeatureChange = (checked: boolean, id: string) => {
    setSelectedFeatures((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const error =
    state && !state.success && "errors" in state.error && state.error.errors;

  const statusOptions = [
    { value: "active", label: "판매중" },
    { value: "inactive", label: "비활성" },
    { value: "soldOut", label: "품절" },
    { value: "deleted", label: "삭제" },
  ];

  return (
    <form action={action} className="space-y-6">
      {selectedFeatures.map((featureId) => (
        <input key={featureId} type="hidden" name="featureIds" value={featureId} />
      ))}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="edit-thumbnail-input">
            썸네일 이미지 *
          </Label>
          <div className="border-border group relative aspect-video w-full overflow-hidden rounded-lg border">
            <ProductThumbnail
              src={thumbnail || "/placeholder.svg"}
              sizes="490px"
              alt={`${product.title} 이미지`}
            />
            <label
              htmlFor="edit-thumbnail-input"
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <div className="text-center text-white">
                <UploadCloud className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm font-medium">
                  {thumbnailFile ? "다른 이미지로 변경" : "이미지 변경"}
                </p>
              </div>
            </label>
            {thumbnailFile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveThumbnail}
                className="absolute top-2 right-2 z-10 h-8 w-8"
                title="원래 이미지로 되돌리기"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            <input
              id="edit-thumbnail-input"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleThumbnailUpload}
            />
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
            <input
              type="hidden"
              name="currentThumbnail"
              value={product.thumbnail}
            />
          </div>
          {error && error["thumbnail"] && (
            <Alert type="error" className="mt-2">{error["thumbnail"][0]}</Alert>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="edit-title">
            상품명 *
          </Label>
          <Input
            id="edit-title"
            name="title"
            defaultValue={product.title}
            placeholder="예: 엘레강트 로즈 청첩장"
            required
          />
          {error && error["title"] && (
            <Alert type="error" className="mt-2">{error["title"][0]}</Alert>
          )}
        </div>

        <div className="flex-1">
          <SelectField
            id="edit-category"
            name="category"
            defaultValue={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value as ProductCategory);
              setSelectedSubCategory("");
            }}
            placeholder="카테고리를 선택하세요"
            data={getCategoryOptions()}
            error={error?.category?.[0]}
            required
          >
            카테고리(대분류)
          </SelectField>
        </div>

        <div className="flex-1">
          <SelectField
            id="edit-subCategory"
            name="subCategory"
            defaultValue={selectedSubCategory}
            onValueChange={(value) => setSelectedSubCategory(value as SubCategory)}
            placeholder="서브 카테고리를 선택하세요"
            data={getSubCategoryOptions(selectedCategory)}
            error={error?.subCategory?.[0]}
            required
          >
            서브 카테고리
          </SelectField>
        </div>

        <div className="col-span-2">
          <SelectField
            id="edit-status"
            name="status"
            defaultValue={status}
            onValueChange={(value) =>
              setStatus(value as "active" | "inactive" | "soldOut" | "deleted")
            }
            placeholder="판매 상태를 선택하세요"
            data={statusOptions}
            required
          >
            판매 상태
          </SelectField>
        </div>

        <div className="col-span-2">
          <Label htmlFor="edit-description">
            상품 설명 *
          </Label>
          <Textarea
            id="edit-description"
            name="description"
            defaultValue={product.description}
            placeholder="상품에 대한 자세한 설명을 입력하세요."
            rows={3}
            required
          />
          {error && error["description"] && (
            <Alert type="error" className="mt-2">{error["description"][0]}</Alert>
          )}
        </div>

        <div className="border-border flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="edit-feature" className="text-base">
              추천 상품
            </Label>
            <TypographyMuted>
              메인 페이지에 추천 상품으로 노출됩니다.
            </TypographyMuted>
          </div>
          <Switch
            id="edit-feature"
            checked={isFeature}
            onCheckedChange={setIsFeature}
          />
        </div>
        <input
          type="hidden"
          name="isFeatured"
          value={isFeature ? "true" : "false"}
        />
        <input
          type="hidden"
          name="isPremium"
          value={isPremium ? "true" : "false"}
        />

        <div>
          <Label htmlFor="edit-price">
            기본 가격 *
          </Label>
          <div className="relative">
            <Input
              id="edit-price"
              name="price"
              type="number"
              defaultValue={product.price}
              placeholder="0"
              min="0"
              step="1000"
              required
              className="pr-12"
            />
            <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
              원
            </span>
          </div>
          {error && error["price"] && (
            <Alert type="error" className="mt-2">{error["price"][0]}</Alert>
          )}
        </div>

        <div>
          <Label htmlFor="edit-priority">
            추천 우선순위
          </Label>
          <Input
            id="edit-priority"
            name="priority"
            type="number"
            defaultValue={product.priority}
            placeholder="0"
            min="0"
            max="100"
            step="1"
          />
          {error && error["priority"] && (
            <Alert type="error" className="mt-2">{error["priority"][0]}</Alert>
          )}
        </div>

        <div className="col-span-2 flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="edit-isPremium" className="text-base">
              프리미엄 상품
            </Label>
            <TypographyMuted>
              추가 유료 옵션을 제공하는 상품입니다.
            </TypographyMuted>
          </div>
          <Switch
            id="edit-isPremium"
            checked={isPremium}
            onCheckedChange={setIsPremium}
          />
        </div>

        {isPremium && (
          <div className="col-span-2 space-y-4 rounded-lg border border-dashed p-4">
            <TypographyH4 className="font-medium">
              프리미엄 기능 선택
            </TypographyH4>
            <div className="grid grid-cols-2 gap-3">
              {premiumFeatures.map((feature) => (
                <div key={feature.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-feature-${feature.code}`}
                    checked={selectedFeatures.includes(feature._id)}
                    onCheckedChange={(checked) =>
                      handleFeatureChange(!!checked, feature._id)
                    }
                  />
                  <Label
                    htmlFor={`edit-feature-${feature.code}`}
                    className="cursor-pointer text-sm leading-none font-medium"
                  >
                    {feature.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 border-t pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={closeModal}
        >
          취소
        </Button>
        <Button type="submit" className="min-w-30" disabled={pending}>
          {pending ? "수정 중..." : "상품 수정"}
        </Button>
      </div>
    </form>
  );
}
