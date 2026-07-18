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
import { Save } from "lucide-react";
import React, { useState } from "react";

interface ChangePasswordField {
  id: string;
  title: string;
  name: string;
  type: string;
  placeholder: string;
}

const passwordFields: ChangePasswordField[] = [
  {
    id: "currentPassword",
    title: "현재 비밀번호",
    name: "currentPassword",
    type: "password",
    placeholder: "현재 비밀번호를 입력하세요",
  },
  {
    id: "newPassword",
    title: "새 비밀번호",
    name: "newPassword",
    type: "password",
    placeholder: "새 비밀번호를 입력하세요",
  },
  {
    id: "confirmPassword",
    title: "새 비밀번호 확인",
    name: "confirmPassword",
    type: "password",
    placeholder: "새 비밀번호를 다시 입력하세요",
  },
];

const ChangePasswordForm = () => {
  const [passwordToggle, setPasswordToggle] = useState<boolean>(false);

  return (
    <form className="space-y-6">
      <Card>
        <CardHeader className="flex items-start justify-between">
          <div>
            <CardTitle>비밀번호 변경</CardTitle>
            <CardDescription>새로운 비밀번호를 설정합니다</CardDescription>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              className={clsx(
                `${passwordToggle ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"}`,
              )}
            >
              <Save className="mr-2 h-4 w-4" />
              저장하기
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordToggle(!passwordToggle)}
            >
              {passwordToggle ? "닫기" : "변경하기"}
            </Button>
          </div>
        </CardHeader>
        {passwordToggle && (
          <CardContent className="space-y-4">
            {passwordFields.map((field) => (
              <TextField
                key={field.id}
                id={field.id}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
              >
                {field.title}
              </TextField>
            ))}
          </CardContent>
        )}
      </Card>
    </form>
  );
};

export default ChangePasswordForm;
