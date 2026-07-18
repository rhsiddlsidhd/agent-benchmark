import Alert from "@/components/molecules/Alert";
import { Label } from "@/components/atoms/label";
import React from "react";
import { Asterisk } from "lucide-react";

interface FormFieldProps {
  id?: string;
  label: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * 모든 폼 필드의 공통 레이아웃을 담당하는 순수 컴포넌트
 */
const FormField = ({
  id,
  label,
  error,
  required,
  children,
}: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="cursor-pointer">
        {label} {required && <Asterisk size={12} />}
      </Label>
      {children}
      {error && <Alert type="error">{error}</Alert>}
    </div>
  );
};

export default FormField;
