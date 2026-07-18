import { useState, useEffect } from "react";
import { calculateCountdown, updateCountdownMessage } from "@/utils/date";

/**
 * 특정 날짜까지의 카운트다운 정보와 상태 메시지를 관리하는 커스텀 훅
 */
export function useCountdown(targetDate: Date) {
  const [countdown, setCountdown] = useState({
    days: 0,
    hour: 0,
    min: 0,
    sec: 0,
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setCountdown(calculateCountdown({ weddingDate: targetDate }));
      const msg = updateCountdownMessage(targetDate);
      setMessage((prev) => (prev === msg ? prev : msg));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return { countdown, message };
}
