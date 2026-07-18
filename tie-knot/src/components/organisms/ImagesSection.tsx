"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import ImageField from "@/components/organisms/fields/ImageField";
import FormField from "@/components/molecules/FormField";
import { TypographyMuted } from "@/components/atoms/typoqraphy";
import type { useImageList } from "@/hooks/useImageList";

interface ImagesSectionProps {
  thumbnail: ReturnType<typeof useImageList>;
  gallery: ReturnType<typeof useImageList>;
}

export function ImagesSection({ thumbnail, gallery }: ImagesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>이미지 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <FormField label="메인 이미지" required>
          <TypographyMuted>
            청첩장에 표시될 메인 이미지를 업로드하세요. (3장)
          </TypographyMuted>
          <ImageField
            id="thumbnail-upload"
            items={thumbnail.items}
            onAdd={thumbnail.add}
            onRemove={thumbnail.remove}
            maxCount={3}
          />
        </FormField>

        <FormField label="갤러리">
          <TypographyMuted>
            청첩장 갤러리에 표시될 이미지를 업로드하세요.
          </TypographyMuted>
          <ImageField
            id="gallery-upload"
            items={gallery.items}
            onAdd={gallery.add}
            onRemove={gallery.remove}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
