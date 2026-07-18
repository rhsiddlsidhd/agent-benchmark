"use client";

import { Label } from "@/components/atoms/label";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/radio-group";
import React, { useState } from "react";
import { LucideIcon } from "lucide-react";
import { FieldBase } from "@/types/field";
import { TypographyMuted, TypographySmall } from "../atoms/typoqraphy";

export type RadioFieldOption<T = string> = {
  id: string;
  value: T;
  title: string;
  description?: string;
  icon?: LucideIcon;
};

type RadioFieldProps<T = string> = Omit<FieldBase, "children"> & {
  options: RadioFieldOption<T>[];
  defaultValue?: T;
};

const RadioField = <T extends string = string>({
  name,
  options,
  defaultValue = "" as T,
}: RadioFieldProps<T>) => {
  const [info, setInfo] = useState<T>(defaultValue);

  return (
    <RadioGroup
      value={info}
      onValueChange={(val) => setInfo(val as T)}
      className={"space-y-2"}
      name={name}
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <div
            key={option.id}
            className="border-muted hover:border-muted-foreground/30 hover:bg-accent/50 has-checked:border-primary has-checked:bg-primary/5 has-checkedshadow-sm flex items-center gap-3 rounded-lg border px-4 py-3 transition-all"
          >
            <RadioGroupItem value={option.value} id={option.id} />
            {Icon && <Icon className="text-muted-foreground h-5 w-5" />}
            <Label htmlFor={option.id} className="flex-1 cursor-pointer">
              <TypographySmall>{option.title}</TypographySmall>
              {option.description && (
                <TypographyMuted>{option.description}</TypographyMuted>
              )}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
};

export default RadioField;
