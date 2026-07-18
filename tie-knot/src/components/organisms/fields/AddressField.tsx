"use client";

import { Input } from "@/components/atoms/input";
import FormField from "@/components/molecules/FormField";
import useDaumPopup from "@/hooks/useDaumPopup";
import React, { useEffect, useState } from "react";

interface AddressFieldProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  defaultValue?: string;
}

/**
 * 도메인 특화 로직(Daum API)이 결합된 주소 입력 필드 (Organism)
 */
const AddressField = ({
  name,
  label = "주소",
  error,
  required = false,
  defaultValue = "",
}: AddressFieldProps) => {
  const { handleDaumAddressPopup, address } = useDaumPopup();
  const [weddingAddress, setWeddingAddress] = useState(defaultValue);

  useEffect(() => {
    if (address) {
      setWeddingAddress(address);
    }
  }, [address]);

  useEffect(() => {
    setWeddingAddress(defaultValue);
  }, [defaultValue]);

  const fieldId = `${name}_address`;

  return (
    <FormField id={fieldId} label={label} error={error} required={required}>
      <Input
        id={fieldId}
        name={fieldId}
        value={weddingAddress}
        placeholder={`${label}를 검색하세요`}
        required={required}
        readOnly
        onClick={handleDaumAddressPopup}
        aria-invalid={!!error}
      />
    </FormField>
  );
};

export default AddressField;
