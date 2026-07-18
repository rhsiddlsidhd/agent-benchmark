import React from "react";

interface DigitalWatchProps {
  countdown: {
    days: number;
    hour: number;
    min: number;
    sec: number;
  };
  message: string | null;
}

/**
 * 카운트다운 숫자와 메시지를 보여주는 순수 UI 컴포넌트 (Molecule)
 * 타이머 로직은 useCountdown 훅으로 분리되었습니다.
 */
const DigitalWatch = ({ countdown, message }: DigitalWatchProps) => {
  return (
    <section>
      <div className="m-auto grid w-3/4 grid-cols-4 gap-2 max-sm:w-full">
        {Object.entries(countdown).map(([key, value]) => (
          <div key={key} className="text-center">
            <p className="text-muted-foreground text-xs">{key.toUpperCase()}</p>
            <p className="text-foreground text-md font-bold">{value}</p>
          </div>
        ))}
      </div>

      {message && (
        <p className="text-muted-foreground p-4 text-center text-xs font-bold">
          {message}
        </p>
      )}
    </section>
  );
};

export default DigitalWatch;
