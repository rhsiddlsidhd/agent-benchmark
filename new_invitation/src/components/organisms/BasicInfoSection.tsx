"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { format } from "date-fns";
import TextField from "@/components/organisms/fields/TextField";
import AddressField from "@/components/organisms/fields/AddressField";
import SwitchField from "@/components/molecules/SwitchField";
import SelectField from "@/components/organisms/fields/SelectField";
import DateField from "@/components/organisms/fields/DateField";
import { MOC_SUBWAY_STATIONS } from "@/data/subway";
import type { ICoupleInfo } from "@/models/coupleInfo.model";

type BasicInfoSectionProps = {
  data?: Pick<ICoupleInfo, "weddingDate" | "venue" | "address" | "addressDetail" | "subwayStation" | "guestbookEnabled">;
};

export function BasicInfoSection({ data }: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Date Picker */}
          <DateField
            id="weddingDate"
            name="wedding_date"
            defaultValue={
              data?.weddingDate ? new Date(data.weddingDate) : undefined
            }
            required
          >
            결혼식 날짜
          </DateField>

          <TextField
            id="weddingTime"
            name="wedding_time"
            type="time"
            placeholder="결혼식 시간"
            defaultValue={
              data?.weddingDate
                ? format(new Date(data.weddingDate), "HH:mm")
                : ""
            }
            required
          >
            결혼식 시간
          </TextField>
        </div>

        {/* 예식장명 */}
        <TextField
          id="venueName"
          name="venue_name"
          type="text"
          placeholder="예: 더 컨벤션 웨딩홀"
          defaultValue={data?.venue}
          required
        >
          예식장명
        </TextField>

        {/* Address */}
        <AddressField required name="venue" defaultValue={data?.address} />

        {/* Address Detail */}
        <TextField
          id="venueAddressDetail"
          name="venue_address_detail"
          type="text"
          placeholder="예: 3층 그랜드볼룸"
          defaultValue={data?.addressDetail}
          required
        >
          상세 주소
        </TextField>

        {/* 인근 지하철 역 */}
        <SelectField
          id="subwayStation"
          name="subway_station"
          placeholder="지하철역 선택"
          defaultValue={data && data.subwayStation}
          data={MOC_SUBWAY_STATIONS}
        >
          인근 지하철 역
        </SelectField>

        {/* Guestbook Toggle */}
        <SwitchField
          id={"guestbookEnabled"}
          name={"guestbook_enabled"}
          message={"하객들이 축하 메시지를 남길 수 있습니다."}
          defaultValue={data?.guestbookEnabled}
        >
          방명록 사용
        </SwitchField>
      </CardContent>
    </Card>
  );
}
