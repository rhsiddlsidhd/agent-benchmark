"use client";

import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";
import { Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ICoupleInfo } from "@/models/coupleInfo.model";
import { format } from "date-fns";
import TextField from "@/components/organisms/fields/TextField";

interface EditCoupleInfoFormProps {
  initialData: ICoupleInfo;
}

export function EditCoupleInfoForm({ initialData }: EditCoupleInfoFormProps) {
  const router = useRouter();

  // Format initial date for input fields
  const weddingDateTime = new Date(initialData.weddingDate);
  const defaultDate = format(weddingDateTime, "yyyy-MM-dd");
  const defaultTime = format(weddingDateTime, "HH:mm");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO: Implement update action

    alert("수정 기능은 아직 구현 중입니다.");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <TypographyH1 className="text-left mb-2 text-3xl font-bold">
          정보 수정하기
        </TypographyH1>
        <TypographyMuted>
          청첩장에 표시될 정보를 수정합니다.
        </TypographyMuted>
      </div>

      <form className="space-y-6 pb-24" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="wedding_date"
                name="wedding_date"
                type="date"
                defaultValue={defaultDate}
                required
              >
                결혼식 날짜
              </TextField>
              <TextField
                id="wedding_time"
                name="wedding_time"
                type="time"
                defaultValue={defaultTime}
                required
              >
                결혼식 시간
              </TextField>
            </div>

            <TextField
              id="venue"
              name="venue"
              type="text"
              defaultValue={initialData.venue}
              placeholder="○○웨딩홀"
              required
            >
              예식장 이름
            </TextField>

            <TextField
              id="address"
              name="address"
              type="text"
              defaultValue={initialData.address}
              placeholder="서울시 강남구..."
              required
            >
              예식장 주소
            </TextField>

            <TextField
              id="subway_station"
              name="subway_station"
              type="text"
              defaultValue={initialData.subwayStation || ""}
              placeholder="강남역"
            >
              가까운 지하철역 (선택)
            </TextField>
          </CardContent>
        </Card>

        {/* 신랑 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>신랑 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              id="groom_name"
              name="groom_name"
              type="text"
              defaultValue={initialData.groom.name}
              required
            >
              신랑 이름
            </TextField>
            <TextField
              id="groom_phone"
              name="groom_phone"
              type="tel"
              defaultValue={initialData.groom.phone}
              placeholder="010-1234-5678"
              required
            >
              신랑 연락처
            </TextField>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="groom_bank_name"
                name="groom_bank_name"
                type="text"
                defaultValue={initialData.groom.bankName || ""}
                placeholder="○○은행"
              >
                신랑 은행명 (선택)
              </TextField>
              <TextField
                id="groom_account_number"
                name="groom_account_number"
                type="text"
                defaultValue={initialData.groom.accountNumber || ""}
                placeholder="123-456-789"
              >
                신랑 계좌번호 (선택)
              </TextField>
            </div>
          </CardContent>
        </Card>

        {/* 신부 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>신부 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              id="bride_name"
              name="bride_name"
              type="text"
              defaultValue={initialData.bride.name}
              required
            >
              신부 이름
            </TextField>
            <TextField
              id="bride_phone"
              name="bride_phone"
              type="tel"
              defaultValue={initialData.bride.phone}
              placeholder="010-1234-5678"
              required
            >
              신부 연락처
            </TextField>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="bride_bank_name"
                name="bride_bank_name"
                type="text"
                defaultValue={initialData.bride.bankName || ""}
                placeholder="○○은행"
              >
                신부 은행명 (선택)
              </TextField>
              <TextField
                id="bride_account_number"
                name="bride_account_number"
                type="text"
                defaultValue={initialData.bride.accountNumber || ""}
                placeholder="123-456-789"
              >
                신부 계좌번호 (선택)
              </TextField>
            </div>
          </CardContent>
        </Card>

        {/* Sticky Bottom Actions */}
        <div className="bg-background/95 border-border fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="mx-auto flex max-w-5xl gap-4">
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button type="submit" size="lg" className="flex-1">
                <Save className="mr-2 h-5 w-5" />
                수정하기
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
