"use client";
import React, { useMemo } from "react";

import { formatInTimeZone } from "date-fns-tz";
import SectionBody from "../../layout/SectionLayout";
import { ko } from "date-fns/locale";
import clsx from "clsx";
import DigitalWatch from "../../molecules/DigitalWatch";
import { useCountdown } from "@/hooks/useCountdown";

import { WeddingMonthCalendarProps } from "./weddingMonthCalendar.mapper";

const getDayOfMonth = (year: number, month: number) => {
  const dayInMonth = [];
  const start = new Date(year, month - 1, 1).getDay();

  for (let i = 0; i < start; i++) {
    dayInMonth.push(null);
  }

  const length = new Date(year, month, 0).getDate();
  for (let i = 1; i <= length; i++) {
    dayInMonth.push(i);
  }

  return dayInMonth;
};

const weekOfKr = ["일", "월", "화", "수", "목", "금", "토"] as const;

const WeddingMonthCalendar = ({ date }: WeddingMonthCalendarProps) => {
  const { countdown, message } = useCountdown(date);

  const monthCalender = useMemo(() => {
    const newDate = new Date(date);
    return getDayOfMonth(newDate.getFullYear(), newDate.getMonth() + 1);
  }, [date]);

  const result = formatInTimeZone(date, "Asia/Seoul", "eeee aa h시 mm분", { locale: ko });

  return (
    <SectionBody title="CALENDAR" subTitle={formatInTimeZone(date, "Asia/Seoul", "yyyy. MM. dd")}>
      <p className="text-muted-foreground font-semibold">{result}</p>
      <ul className="mx-auto grid w-52 grid-cols-7">
        {weekOfKr.map((kr, i) => {
          const isToday = i === 0 || i === 6;
          return (
            <li key={i} className="p-2 text-center">
              <span
                className={clsx(
                  "flex items-center justify-center rounded-full p-1 text-xs",
                  isToday && "text-primary/70",
                )}
              >
                {kr}
              </span>
            </li>
          );
        })}
        {monthCalender.map((day, idx) => {
          const Dday = day === new Date(date).getDate();
          return (
            <li
              key={idx}
              className={clsx(
                "px-1 py-3 text-center text-xs",
                Dday && "rounded-full bg-primary font-bold text-primary-foreground",
              )}
            >
              {day}
            </li>
          );
        })}
      </ul>
      <DigitalWatch countdown={countdown} message={message} />
    </SectionBody>
  );
};

export default WeddingMonthCalendar;
