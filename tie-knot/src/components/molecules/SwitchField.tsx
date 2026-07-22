"use client";

import { Switch, TypographyMuted } from "@/components/atoms";
import { Label } from "@radix-ui/react-label";
import React, { useState } from "react";

import { FieldBase } from "@/types";

type SwitchFieldProps = Omit<FieldBase, "defaultValue"> & {
  message?: string;
  defaultValue?: boolean;
};

const SwitchField = ({
  id,
  name,
  children,
  message,
  defaultValue,
}: SwitchFieldProps) => {
  const [info, setInfo] = useState<boolean>(defaultValue ?? false);

  return (
    <div className="border-border flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer text-base">
          {children}
        </Label>
        <TypographyMuted>{message}</TypographyMuted>
      </div>
      <Switch
        id={id}
        name={name}
        checked={info}
        onCheckedChange={(checked) => setInfo(checked)}
      />
    </div>
  );
};

export { SwitchField };
