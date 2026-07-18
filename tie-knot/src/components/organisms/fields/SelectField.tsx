import FormField from "@/components/molecules/FormField";
import BaseSelect, { SelectOption } from "@/components/molecules/BaseSelect";
import React, { useState, useEffect } from "react";
import { FieldBase } from "@/types/field";

type SelectFieldProps = FieldBase & {
  placeholder: string;
  data: Record<string, string>[];
  onValueChange?: (value: string) => void;
  error?: string; // 에러 메시지 타입 추가
  required?: boolean; // 필수 여부 타입 추가
};

/**
 * 객체 배열(Record<string, string>[])을 데이터로 받는 셀렉트 필드
 * 기본적으로 각 객체는 'value'와 'label' 키를 가져야 합니다.
 */
const SelectField = ({
  id,
  name,
  children,
  placeholder,
  defaultValue,
  data,
  error,
  required = false, // 기본값 false 설정
  onValueChange,
}: SelectFieldProps) => {
  const [info, setInfo] = useState<string | undefined>(defaultValue);

  useEffect(() => {
    setInfo(defaultValue);
  }, [defaultValue]);

  // Record<string, string> 형식을 BaseSelect가 사용하는 SelectOption[] 형식으로 맞춤
  const finalOptions: SelectOption[] = data.map((item) => ({
    value: item.value,
    label: item.label,
  }));

  const handleChange = (value: string) => {
    setInfo(value);
    onValueChange?.(value);
  };

  return (
    <FormField id={id} label={children} required={required} error={error}>
      <BaseSelect
        id={id}
        name={name}
        value={info ?? ""}
        onValueChange={handleChange}
        placeholder={placeholder}
        options={finalOptions}
      />
    </FormField>
  );
};

export default SelectField;
