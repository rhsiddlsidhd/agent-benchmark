import BaseSelect from "@/components/molecules/BaseSelect";
import React from "react";

const StatusSelect = ({
  value,
  onValueChange,
  disabled,
  items,
  className = "w-full",
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  items: readonly { value: string; label: string }[];
  className?: string;
  placeholder?: string;
}) => {
  return (
    <BaseSelect
      value={value}
      onValueChange={onValueChange}
      options={[...items]}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default StatusSelect;
