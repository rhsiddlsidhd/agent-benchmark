import { Input } from "@/components/atoms/input";
import FormField from "@/components/molecules/FormField";
import { FieldBase } from "@/types/field";
import React, { HTMLInputTypeAttribute, useState, useEffect } from "react";

export interface TextFieldProps extends FieldBase {
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  className?: string;
}

/**
 * 범용 텍스트 입력 필드 (Organism)
 * 데이터 중심 네이밍 컨벤션에 따라 TextField로 명명되었습니다.
 */
const TextField = ({
  id,
  name,
  children,
  type = "text",
  placeholder,
  required = false,
  error,
  defaultValue = "",
  readOnly,
  className,
}: TextFieldProps) => {
  const [info, setInfo] = useState(defaultValue);

  useEffect(() => {
    setInfo(defaultValue);
  }, [defaultValue]);

  return (
    <FormField id={id} label={children} error={error} required={required}>
      <Input
        id={id}
        name={name}
        type={type}
        value={info}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        onChange={(e) => setInfo(e.target.value)}
        aria-invalid={!!error}
        className={className}
        autoComplete={name}
      />
    </FormField>
  );
};

export default TextField;
