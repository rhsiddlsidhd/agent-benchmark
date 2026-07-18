"use client";
import { Input } from "@/components/atoms/input";
import { useBanks } from "@/hooks/useBanks";
import FormField from "@/components/molecules/FormField";
import BaseSelect from "@/components/molecules/BaseSelect";
import React, { useState, useEffect } from "react";

interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
}

interface BankFieldProps {
  id: string;
  label?: string;
  defaultBankName?: string;
  defaultAccountNumber?: string;
  error?: string;
  required?: boolean;
}

/**
 * 은행 선택과 계좌번호 입력을 하나로 묶은 도메인 전용 필드 (Organism)
 * 데이터 중심 네이밍 컨벤션에 따라 BankField로 명명되었습니다.
 */
const BankField = ({
  id,
  label = "계좌번호",
  defaultBankName = "",
  defaultAccountNumber = "",
  error,
  required,
}: BankFieldProps) => {
  const [info, setInfo] = useState<BankAccountInfo>({
    bankName: defaultBankName,
    accountNumber: defaultAccountNumber,
  });

  const { banks } = useBanks();

  // defaultValue 변경 시 state 업데이트 (부모 폼에서 데이터 초기화 시 필요)
  useEffect(() => {
    setInfo({
      bankName: defaultBankName,
      accountNumber: defaultAccountNumber,
    });
  }, [defaultBankName, defaultAccountNumber]);

  // 은행 목록을 BaseSelect 옵션 형식으로 변환
  const bankOptions =
    banks?.map((bank) => ({
      value: bank.bank,
      label: bank.name.ko,
    })) ?? [];

  return (
    <FormField id={id} label={label} error={error} required={required}>
      <div className="grid grid-cols-[120px_1fr] gap-2 max-sm:grid-cols-1">
        <BaseSelect
          name={`${id}_bank_name`}
          value={info.bankName}
          onValueChange={(value) =>
            setInfo((prev) => ({
              ...prev,
              bankName: value,
            }))
          }
          placeholder="은행 선택"
          options={bankOptions}
        />
        <Input
          placeholder="계좌번호"
          name={`${id}_account_number`}
          onChange={(e) =>
            setInfo((prev) => ({
              ...prev,
              accountNumber: e.target.value,
            }))
          }
          value={info.accountNumber}
        />
      </div>
    </FormField>
  );
};

export default BankField;
