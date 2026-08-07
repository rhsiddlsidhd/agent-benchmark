"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

import { Button, Input } from "@/client/components/atoms";

interface QuantityStepperProps {
  id: string;
  value: number;
  min: number;
  max: number; // 실제 상한(무제한 모드는 소프트 상한이 들어온다 — organisms/ProductOptions.tsx §7 참고)
  onChange: (next: number) => void;
  disabled?: boolean; // fixed 모드에서 true
  unlimited?: boolean; // true면 상한 안내(aria)에 상한을 노출하지 않는다
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * 순수 controlled 수량 증감 위젯. 범위/모드 파생 로직은 소유하지 않는다 —
 * 호출부(organisms/ProductOptions)가 min/max/value/onChange를 전부 결정한다.
 */
const QuantityStepper = ({
  id,
  value,
  min,
  max,
  onChange,
  disabled,
  unlimited,
}: QuantityStepperProps) => {
  const handleDecrement = () => {
    if (disabled) return;
    onChange(Math.max(min, value - 1));
  };

  const handleIncrement = () => {
    if (disabled) return;
    onChange(Math.min(max, value + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 입력 도중엔 clamp하지 않는다 — "1"을 지우고 "12"를 치는 도중 매 키 입력마다
    // clamp하면 중간값이 범위 밖일 때 타이핑 자체가 막힌다. 확정 clamp는 blur에서.
    onChange(raw === "" ? NaN : Number(raw));
  };

  const handleBlur = () => {
    const next = Number.isNaN(value) ? min : clamp(value, min, max);
    onChange(next);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="수량 감소"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={Number.isNaN(value) ? "" : value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        min={min}
        max={unlimited ? undefined : max}
        step={1}
        className="w-16 text-center"
        aria-label="수량"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="수량 증가"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export { QuantityStepper };
