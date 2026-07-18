"use client";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import TextField from "@/components/organisms/fields/TextField";
import clsx from "clsx";
import { TypographyMuted } from "@/components/atoms/typoqraphy";
import { Save } from "lucide-react";
import React, { useState } from "react";

const BasicInfoForm = ({
  email,
  name,
  phone,
}: {
  email: string;
  name: string;
  phone: string;
}) => {
  const [basicInfoToggle, setBasicInfoToggle] = useState<boolean>(false);
  return (
    <form className="space-y-6">
      {/* 기본 정보 섹션 */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              이메일, 이름, 전화번호를 관리합니다
            </CardDescription>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              className={clsx(
                `${basicInfoToggle ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"}`,
              )}
            >
              <Save className="mr-2 h-4 w-4" />
              저장하기
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setBasicInfoToggle(!basicInfoToggle)}
            >
              {basicInfoToggle ? "닫기" : "변경하기"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <TextField
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              readOnly
              className="bg-muted"
            >
              이메일
            </TextField>

            <TypographyMuted className="pt-2">
              이메일은 변경할 수 없습니다
            </TypographyMuted>
          </div>

          <TextField
            id="name"
            name="name"
            type="text"
            defaultValue={name}
            readOnly={!basicInfoToggle}
            className={!basicInfoToggle ? "bg-muted" : ""}
          >
            이름
          </TextField>

          <TextField
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            readOnly={!basicInfoToggle}
            className={!basicInfoToggle ? "bg-muted" : ""}
          >
            전화번호
          </TextField>

          {basicInfoToggle && (
            <TextField id="password" name="password" type="password">
              비밀번호
            </TextField>
          )}
        </CardContent>
      </Card>
    </form>
  );
};

export default BasicInfoForm;
