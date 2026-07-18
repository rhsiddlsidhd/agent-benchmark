"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseSelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

/**
 * Atoms를 조합하여 데이터만 넣으면 렌더링되는 순수 Select 박스 컴포넌트
 */
const BaseSelect = ({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "선택해주세요",
  options,
  className,
  contentClassName,
  disabled,
}: BaseSelectProps) => {
  return (
    <Select
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn("max-h-60!", contentClassName)}
        position="popper"
        align="start"
      >
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BaseSelect;
