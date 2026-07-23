"use client";

import { FormField } from "@/client/components/molecules/FormField";
import { AutoCompleteList } from "@/client/components/molecules/AutoCompleteList";
import { Command, CommandInput } from "@/client/components/atoms";
import { FieldBase } from "@/shared/types";
import { useMemo, useState } from "react";

type ComboboxOption = { value: string; label: string };

type ComboboxFieldProps = FieldBase & {
  placeholder: string;
  options: ComboboxOption[];
  error?: string;
  required?: boolean;
};

/**
 * 타이핑으로 후보를 좁히되, 목록에서 직접 선택해야만 값이 확정되는 필드 —
 * 자유 텍스트 그대로 제출되지 않는다(선택 전까진 hidden input이 비어있음).
 */
const ComboboxField = ({
  id,
  name,
  children,
  placeholder,
  defaultValue,
  options,
  error,
  required = false,
}: ComboboxFieldProps) => {
  const defaultLabel = options.find((o) => o.value === defaultValue)?.label ?? "";
  const [inputValue, setInputValue] = useState(defaultLabel);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (!inputValue) return [];
    return options.filter((option) => option.label.includes(inputValue)).slice(0, 8);
  }, [inputValue, options]);

  const handleSelect = (label: string) => {
    const matched = options.find((option) => option.label === label);
    if (!matched) return;

    setSelectedValue(matched.value);
    setInputValue(matched.label);
    setIsOpen(false);
  };

  return (
    <FormField id={id} label={children} required={required} error={error}>
      <input type="hidden" name={name} value={selectedValue ?? ""} />
      <Command
        shouldFilter={false}
        className="relative overflow-visible rounded-md border"
      >
        <CommandInput
          id={id}
          value={inputValue}
          placeholder={placeholder}
          onValueChange={(value) => {
            setInputValue(value);
            setSelectedValue(undefined);
            setIsOpen(true);
          }}
        />
        <AutoCompleteList
          suggestions={suggestions.map((option) => option.label)}
          isOpen={isOpen}
          onSelect={handleSelect}
        />
      </Command>
    </FormField>
  );
};

export { ComboboxField };
