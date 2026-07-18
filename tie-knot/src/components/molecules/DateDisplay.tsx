import React from "react";
import { formatDate, DateFormatType } from "@/utils/date";

interface DateDisplayProps {
  date: string;
  type: DateFormatType;
  className?: string;
}

/**
 * 날짜를 다양한 형식으로 렌더링하는 순수 UI 컴포넌트 (Molecule)
 * 복잡한 포맷팅 로직은 utils/date.ts 로 분리되었습니다.
 */
const DateDisplay = ({ date, type, className }: DateDisplayProps) => {
  const formatted = formatDate(date, type);

  return <span className={className}>{formatted}</span>;
};

export default DateDisplay;
